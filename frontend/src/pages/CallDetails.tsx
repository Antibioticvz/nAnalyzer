import React from 'react';
import { useParams } from 'react-router-dom';

const CallDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="call-details">
      <h1>Call Details: {id}</h1>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Duration</div>
          <div className="metric-value">00:00</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Overall Sentiment</div>
          <div className="metric-value">Positive</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Talk/Listen</div>
          <div className="metric-value">60/40</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Questions</div>
          <div className="metric-value">5</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Full Transcript</h2>
        <p>Transcript content will appear here...</p>
      </div>

      <div className="card">
        <h2 className="card-title">Sentiment Timeline</h2>
        <div style={{ height: '200px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          Chart placeholder
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Key Keywords</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.5rem 1rem', backgroundColor: '#e3f2fd', borderRadius: '20px' }}>
            product
          </span>
          <span style={{ padding: '0.5rem 1rem', backgroundColor: '#e3f2fd', borderRadius: '20px' }}>
            pricing
          </span>
          <span style={{ padding: '0.5rem 1rem', backgroundColor: '#e3f2fd', borderRadius: '20px' }}>
            demo
          </span>
        </div>
      </div>
    </div>
  );
};

export default CallDetails;
