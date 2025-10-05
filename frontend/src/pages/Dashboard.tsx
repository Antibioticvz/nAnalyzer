import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Calls</div>
          <div className="metric-value">0</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Calls</div>
          <div className="metric-value">0</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Average Sentiment</div>
          <div className="metric-value">N/A</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Talk/Listen Ratio</div>
          <div className="metric-value">N/A</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent Calls</h2>
        <p>No calls recorded yet. Start monitoring a call to see data here.</p>
      </div>

      <div className="card">
        <h2 className="card-title">Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary">Start New Call</button>
          <button className="btn btn-primary">Upload Audio File</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
