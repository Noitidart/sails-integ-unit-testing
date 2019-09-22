import React, { useEffect, useRef, useState } from 'react';
import useForceUpdate from 'use-force-update';
import produce from 'immer';

import EditableRow from './EditableRow';

const ViewType = {
  ACTIVE: 'ACTIVE',
  HISTORY: 'HISTORY'
};

const ActiveFilterType = {
  ALL: 'All',
  COOKING: 'Cooking Now',
  JUST_COOKED: 'Just Cooked'
};

function DataViews({ _csrf, me }) {
  const [pagination, setPagination] = useState({
    viewType: ViewType.ACTIVE,
    network: {
      isLoading: true,
      results: [],
      error: null
    }
  });

  const [activeFilter, setActiveFilter] = useState(ActiveFilterType.ALL);
  const [cookedWithinSec, setCookedWithinSec] = useState('5');
  const forceUpdate = useForceUpdate();

  // listen for socket events
  useEffect(() => {
    const handleOrderCreatedOrUpdated = order => {
      const isUpdatedOrderInactive = ['DELIVERED', 'CANCELLED'].includes(order.status);
      setPagination(
        produce(draft => {
          const prevOrderIndex = draft.network.results.findIndex(prevOrder => prevOrder.id === order.id);
          const prevOrderDraft = draft.network.results[prevOrderIndex];
          if (isUpdatedOrderInactive) {
            if (prevOrderDraft) {
              // need to remove it
              draft.network.results.splice(prevOrderIndex, 1);
              draft.network.total--;
            }
          } else {
            if (!prevOrderDraft) {
              // need to add it
              // find index of element that has an orderNumber higher then incoming order's
              const insertAtIndex = draft.network.results.findIndex(result => result.orderNumber > order.orderNumber);
              if (insertAtIndex === -1) {
                draft.network.results.push(order);
              } else {
                draft.network.results.splice(insertAtIndex, 0, order);
              }
              draft.network.total++;
            } else {
              // need to update it
              Object.assign(prevOrderDraft, order);
            }
          }
        })
      );
    };

    if (pagination.viewType === ViewType.ACTIVE) {
      io.socket.on('order-created-or-updated', handleOrderCreatedOrUpdated);
    }

    return () => {
      if (pagination.viewType === ViewType.ACTIVE) {
        io.socket.off('order-created-or-updated', handleOrderCreatedOrUpdated);
      }
    };
  }, [pagination.viewType]);

  // fetch page results
  useEffect(() => {
    setPagination(
      produce(draft => {
        draft.network.isLoading = true;
        draft.network.error = null;
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
                type: pagination.viewType === ViewType.ACTIVE ? 'active' : 'all'
              }),
            resolve
          );
        });

        setPagination(
          produce(draft => {
            draft.network.isLoading = false;
            draft.network.results = res.results;
          })
        );
      } catch (err) {
        setPagination(
          produce(draft => {
            draft.network.isLoading = false;
            draft.network.error = err.message;
          })
        );
      }
    })();
  }, [pagination.viewType]);

  const toggleViewType = () =>
    setPagination(
      produce(draft => {
        draft.isLoading = true;
        draft.viewType = draft.viewType === ViewType.ACTIVE ? ViewType.HISTORY : ViewType.ACTIVE;
      })
    );

  const networkOk = !pagination.network.isLoading && !pagination.network.error;

  const getHandleActiveFilterClick = nextFilter => e => {
    e.preventDefault();
    setActiveFilter(nextFilter);
  };

  let filteredResults = pagination.network.results;
  if (pagination.viewType === ViewType.ACTIVE) {
    if (activeFilter === ActiveFilterType.COOKING) {
      filteredResults = filteredResults.filter(order => order.status === 'CREATED');
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
  }, [activeFilter, cookedWithinSec, pagination.network.results]);

  return (
    <div className="my-5">
      <button type="button" className="btn btn-outline-info float-right" onClick={toggleViewType}>
        {pagination.viewType === ViewType.ACTIVE ? 'History' : 'Active Orders'}
      </button>

      <h2 className="mb-3">{pagination.viewType === ViewType.ACTIVE ? 'Active Orders' : 'Order History'}</h2>

      {pagination.network.isLoading && <p className="lead text-center">Loading...</p>}

      {!pagination.network.isLoading && pagination.network.error && (
        <p className="lead text-center">An error occured. {pagination.network.error}</p>
      )}

      {networkOk && (
        <>
          {pagination.viewType === ViewType.ACTIVE && (
            <>
              <div className="row mb-2">
                <div className="col-3">
                  <div className="dropdown">
                    <button
                      className="btn btn-secondary dropdown-toggle"
                      type="button"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      Filter: {activeFilter}
                    </button>
                    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                      <a className="dropdown-item" href="#" onClick={getHandleActiveFilterClick(ActiveFilterType.ALL)}>
                        All
                      </a>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={getHandleActiveFilterClick(ActiveFilterType.COOKING)}
                      >
                        Cooking Now
                      </a>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={getHandleActiveFilterClick(ActiveFilterType.JUST_COOKED)}
                      >
                        Just Cooked
                      </a>
                    </div>
                  </div>
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

      {networkOk && filteredResults.length === 0 && <p className="lead text-center">No orders</p>}

      {networkOk && filteredResults.length > 0 && (
        <div>
          <div className="row font-weight-bold text-center mb-1">
            <div className="col-1">#</div>
            <div className="col-2">Status</div>
            <div className="col-2">Name</div>
            <div className="col-4">Destination</div>
            <div className="col-2">Last Updated</div>
            <div className="col-1" />
          </div>
          {filteredResults.map(result => (
            <EditableRow
              key={result.id}
              result={result}
              _csrf={_csrf}
              isLoggedIn={Boolean(me)}
              shouldShowTools={pagination.viewType === ViewType.HISTORY}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DataViews;
