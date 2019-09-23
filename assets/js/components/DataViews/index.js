import React, { useEffect, useRef, useState } from 'react';
import useForceUpdate from 'use-force-update';
import produce from 'immer';
import { startCase } from 'lodash';

import Dropdown from '../Dropdown';
import EditableRow from './EditableRow';

import { OrderStatus } from '../../../../types';

const ViewType = {
  ACTIVE: 'ACTIVE',
  HISTORY: 'HISTORY'
};

const ActiveFilterType = {
  ALL: 'ALL',
  COOKING_NOW: 'COOKING_NOW',
  JUST_COOKED: 'JUST_COOKED'
};

function DataViews({ _csrf }) {
  const [pageData, setPageData] = useState({
    viewType: ViewType.ACTIVE,
    isLoading: true,
    results: [],
    error: null
  });
  const [activeFilter, setActiveFilter] = useState(ActiveFilterType.ALL);
  const [cookedWithinSec, setCookedWithinSec] = useState('5');
  const forceUpdate = useForceUpdate();

  // listen for socket events if on active page
  useEffect(() => {
    const handleOrderCreatedOrUpdated = order => {
      const isUpdatedOrderInactive = [OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status);
      setPageData(
        produce(draft => {
          const prevOrderIndex = draft.results.findIndex(prevOrder => prevOrder.id === order.id);
          const prevOrderDraft = draft.results[prevOrderIndex];
          if (isUpdatedOrderInactive) {
            if (prevOrderDraft) {
              // need to remove it
              draft.results.splice(prevOrderIndex, 1);
            }
          } else {
            if (!prevOrderDraft) {
              // need to add it
              const insertAtIndex = draft.results.findIndex(result => result.createdAt > order.creatdAt);
              if (insertAtIndex === -1) {
                draft.results.push(order);
              } else {
                draft.results.splice(insertAtIndex, 0, order);
              }
            } else {
              // need to update it
              Object.assign(prevOrderDraft, order);
            }
          }
        })
      );
    };

    if (pageData.viewType === ViewType.ACTIVE) {
      io.socket.on('order-created-or-updated', handleOrderCreatedOrUpdated);
    }

    return () => {
      if (pageData.viewType === ViewType.ACTIVE) {
        io.socket.off('order-created-or-updated', handleOrderCreatedOrUpdated);
      }
    };
  }, [pageData.viewType]);

  // fetch page results on view change
  useEffect(() => {
    setPageData(
      produce(draft => {
        draft.isLoading = true;
        draft.error = null;
      })
    );

    (async () => {
      // slow it down so the speed doesn't give people a headache
      await new Promise(resolve => setTimeout(resolve, 500));

      let res;
      try {
        res = await new Promise(resolve => {
          io.socket.get(
            '/api/v1/orders?' +
              new URLSearchParams({
                onlyActive: pageData.viewType === ViewType.ACTIVE ? true : false
              }),
            resolve
          );
        });

        setPageData(
          produce(draft => {
            draft.isLoading = false;
            draft.results = res.results;
          })
        );
      } catch (err) {
        setPageData(
          produce(draft => {
            draft.isLoading = false;
            draft.error = err.message;
          })
        );
      }
    })();
  }, [pageData.viewType]);

  const toggleViewType = () =>
    setPageData(
      produce(draft => {
        draft.isLoading = true;
        draft.viewType = draft.viewType === ViewType.ACTIVE ? ViewType.HISTORY : ViewType.ACTIVE;
      })
    );

  const isPageSuccesfullyLoaded = !pageData.isLoading && !pageData.error;

  let filteredResults = pageData.results;
  if (pageData.viewType === ViewType.ACTIVE) {
    if (activeFilter === ActiveFilterType.COOKING) {
      filteredResults = filteredResults.filter(order => order.status === OrderStatus.CREATED);
    } else if (activeFilter === ActiveFilterType.JUST_COOKED) {
      const timeToLive = cookedWithinSec * 1000;

      filteredResults = filteredResults.filter(order => {
        if (!order.cookedAt) return false;
        const timeLived = Date.now() - order.cookedAt;
        return timeLived < timeToLive;
      });
    }
  }

  // set timer to force update when something moves out of cookedWithinSec
  const savedDeathTimer = useRef();
  useEffect(() => {
    if (activeFilter !== ActiveFilterType.JUST_COOKED || isNaN(cookedWithinSec) || filteredResults.length === 0) {
      return;
    }

    const timeToLive = cookedWithinSec * 1000;

    let timeTillFirstDeath = timeToLive;
    filteredResults.forEach(order => {
      const timeLived = Date.now() - order.cookedAt;
      const timeTillDeath = Math.max(timeToLive - timeLived, 0);

      if (timeTillDeath < timeTillFirstDeath) {
        timeTillFirstDeath = timeTillDeath;
      }
    });

    savedDeathTimer.current = window.setTimeout(forceUpdate, timeTillFirstDeath);

    return () => {
      window.clearTimeout(savedDeathTimer.current);
    };
  }, [activeFilter, cookedWithinSec, pageData.results]);

  return (
    <div className="my-5">
      <button type="button" className="btn btn-outline-info float-right" onClick={toggleViewType}>
        {pageData.viewType === ViewType.ACTIVE ? 'View History' : 'View Active Orders'}
      </button>

      <h2 className="mb-3">{pageData.viewType === ViewType.ACTIVE ? 'Active Orders' : 'Order History'}</h2>

      {pageData.isLoading && <p className="lead text-center">Loading...</p>}

      {!pageData.isLoading && pageData.error && <p className="lead text-center">An error occured. {pageData.error}</p>}

      {isPageSuccesfullyLoaded && (
        <>
          {pageData.viewType === ViewType.ACTIVE && (
            <>
              <div className="row mb-2">
                <div className="col-3">
                  <Dropdown
                    values={Object.keys(ActiveFilterType).map(id => ({ id, label: startCase(id.toLowerCase()) }))}
                    defaultValueId={activeFilter}
                    onValueChange={value => setActiveFilter(value.id)}
                    labelPrefix="Filter:"
                  />
                </div>
              </div>

              {activeFilter === ActiveFilterType.JUST_COOKED && (
                <div className="row mb-2">
                  <div className="col-1">
                    <label htmlFor="cooked-within-sec">within</label>
                  </div>

                  <div className="col-2">
                    <input
                      type="number"
                      min="1"
                      className="form-control ml-2 mr-2"
                      id="cooked-within-sec"
                      value={cookedWithinSec}
                      disabled={activeFilter !== ActiveFilterType.JUST_COOKED}
                      onChange={e => setCookedWithinSec(e.target.value)}
                    />
                  </div>

                  <div className="col-1">
                    <label htmlFor="cooked-within-sec">sec</label>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {isPageSuccesfullyLoaded && filteredResults.length === 0 && <p className="lead text-center">No orders</p>}

      {isPageSuccesfullyLoaded && filteredResults.length > 0 && (
        <div>
          <div className="row font-weight-bold text-center mb-1">
            <div className="col-2">Status</div>
            <div className="col-2">Name</div>
            <div className="col-4">Destination</div>
            <div className="col-3">Last Updated</div>
            <div className="col-1" />
          </div>
          {filteredResults.map(result => (
            <EditableRow
              key={result.id}
              result={result}
              _csrf={_csrf}
              shouldShowTools={pageData.viewType === ViewType.HISTORY}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DataViews;
