import React, { useState, useEffect } from 'react';
import produce from 'immer';
import classnames from 'classnames';

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
    page: 1,
    size: 30,
    viewType: ViewType.ACTIVE,
    network: {
      isLoading: true,
      results: [],
      total: 0,
      error: null
    }
  });

  const [activeFilter, setActiveFilter] = useState(ActiveFilterType.ALL);
  const [cookedWithinSec, setCookedWithinSec] = useState('5');

  // listen for socket events
  useEffect(() => {
    const handleOrderCreatedOrUpdated = order => {
      console.log('order created or updated, order number:', order.orderNumber);
      const isUpdatedOrderInactive = ['DELIVERED', 'CANCELLED'].includes(order.status);
      setPagination(
        produce(draft => {
          const prevOrderIndex = draft.network.results.findIndex(prevOrder => prevOrder.id === order.id);
          const prevOrderDraft = draft.network.results[prevOrderIndex];
          if (isUpdatedOrderInactive) {
            if (prevOrderDraft) {
              // need to remove it
              console.log('removing it as its inactive and currently present');
              draft.network.results.splice(prevOrderIndex, 1);
              draft.network.total--;
            }
          } else {
            if (!prevOrderDraft) {
              // need to add it
              console.log('adding it as its active but not present');
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
              console.log('updating it as its active and present');
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
        console.log('unregistering handlers');
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
        res = await new Promise((resolve, reject) => {
          io.socket.get(
            '/api/v1/orders?' +
              new URLSearchParams({
                page: pagination.page,
                size: pagination.size,
                type: pagination.viewType === ViewType.ACTIVE ? 'active' : 'all'
              }),
            resolve
          );
        });

        setPagination(
          produce(draft => {
            draft.network.isLoading = false;
            draft.network.results = res.results;
            draft.network.total = res.total;
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
  }, [pagination.page, pagination.size, pagination.viewType]);

  const toggleViewType = () =>
    setPagination(
      produce(draft => {
        draft.isLoading = true;
        draft.viewType = draft.viewType === ViewType.ACTIVE ? ViewType.HISTORY : ViewType.ACTIVE;
        draft.page = 1;
      })
    );

  const networkOk = !pagination.network.isLoading && !pagination.network.error;

  const totalPages = Math.ceil(pagination.network.total / pagination.size);

  const getHandlePaginationClick = nextSize => e => {
    e.preventDefault();
    setPagination(
      produce(draft => {
        draft.size = nextSize;
      })
    );
  };

  const getHandleActiveFilterClick = nextFilter => e => {
    e.preventDefault();
    setActiveFilter(nextFilter);
  };

  const getHandlePageClick = nextPage => e => {
    e.preventDefault();
    setPagination(
      produce(draft => {
        draft.page = nextPage;
      })
    );
  };

  const startIndex = pagination.size * (pagination.page - 1);
  const endIndex = startIndex + pagination.size;
  const pageOrders = pagination.network.results.slice(startIndex, endIndex);

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
                  Per Page: {pagination.size}
                </button>
                <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                  <a className="dropdown-item" href="#" onClick={getHandlePaginationClick(5)}>
                    5
                  </a>
                  <a className="dropdown-item" href="#" onClick={getHandlePaginationClick(10)}>
                    10
                  </a>
                  <a className="dropdown-item" href="#" onClick={getHandlePaginationClick(25)}>
                    25
                  </a>
                  <a className="dropdown-item" href="#" onClick={getHandlePaginationClick(100)}>
                    100
                  </a>
                  <a className="dropdown-item" href="#" onClick={getHandlePaginationClick(500)}>
                    500
                  </a>
                </div>
              </div>
            </div>
          </div>

          {pagination.network.total > 0 && (
            <div className="row mb-2">
              <div className="col-4">
                <nav aria-label="Page navigation">
                  <ul className="pagination">
                    <li className={classnames('page-item', pagination.page === 1 && 'disabled')}>
                      <a
                        className="page-link"
                        href="#"
                        aria-label="Previous"
                        onClick={getHandlePageClick(pagination.page - 1)}
                      >
                        <span aria-hidden="true">&laquo;</span>
                        <span className="sr-only">Prev</span>
                      </a>
                    </li>
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <li
                          className={classnames('page-item', pagination.page === pageNumber && 'active')}
                          key={pageNumber}
                        >
                          <a className="page-link" href="#" onClick={getHandlePageClick(pageNumber)}>
                            {pageNumber}
                          </a>
                        </li>
                      );
                    })}
                    <li className={classnames('page-item', pagination.page === totalPages && 'disabled')}>
                      <a
                        className="page-link"
                        href="#"
                        aria-label="Next"
                        onClick={getHandlePageClick(pagination.page + 1)}
                      >
                        <span aria-hidden="true">&raquo;</span>
                        <span className="sr-only">Next</span>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {networkOk && pageOrders.length === 0 && (
        <p className="lead text-center">{pagination.network.total > 0 ? 'No orders on this page' : 'No orders'}</p>
      )}

      {networkOk && pageOrders.length > 0 && (
        <div>
          <div className="row font-weight-bold text-center mb-1">
            <div className="col-1">#</div>
            <div className="col-2">Status</div>
            <div className="col-2">Name</div>
            <div className="col-4">Destination</div>
            <div className="col-2">Last Updated</div>
            <div className="col-1" />
          </div>
          {pageOrders.map(result => (
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
