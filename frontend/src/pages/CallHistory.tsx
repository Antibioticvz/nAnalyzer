import React from 'react';

const CallHistory: React.FC = () => {
  return (
    <div className="call-history">
      <h1>Call History</h1>

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search calls..."
            style={{
              padding: '0.75rem',
              width: '100%',
              maxWidth: '400px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Duration</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Sentiment</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                No calls recorded yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallHistory;
