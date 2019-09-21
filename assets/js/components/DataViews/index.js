import React, { useState } from 'react';

const ViewType = {
  ACTIVE: 'ACTIVE',
  HISTORY: 'HISTORY'
};

function DataViews() {
  const [viewType, setViewType] = useState(ViewType.ACTIVE);

  const toggleViewType = () => {
    console.log('toggling view');
    setViewType(viewType === ViewType.ACTIVE ? ViewType.HISTORY : ViewType.ACTIVE);
  };

  return (
    <div className="my-5">
      <button type="button" className="btn btn-outline-info float-right" onClick={toggleViewType}>
        {viewType === ViewType.ACTIVE ? 'History' : 'Active Orders'}
      </button>

      <h2>{viewType === ViewType.ACTIVE ? 'Active Orders' : 'Order History'}</h2>
    </div>
  );
}

export default DataViews;
