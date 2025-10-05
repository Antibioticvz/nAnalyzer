import React from 'react';

const Analytics: React.FC = () => {
  return (
    <div className="analytics">
      <h1>Analytics</h1>

      <div className="card">
        <h2 className="card-title">Performance Trends</h2>
        <div style={{ height: '300px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          Chart placeholder - Calls over time
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Sentiment Distribution</h2>
        <div style={{ height: '300px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          Chart placeholder - Sentiment breakdown
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Top Keywords</h2>
        <div style={{ height: '300px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          Word cloud placeholder
        </div>
      </div>
    </div>
  );
};

export default Analytics;
