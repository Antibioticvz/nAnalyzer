import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [autoDeleteDays, setAutoDeleteDays] = useState(7);
  const [piiRedaction, setPiiRedaction] = useState(true);

  const handleSave = () => {
    // TODO: Save settings via API
    alert('Settings saved!');
  };

  return (
    <div className="settings">
      <h1>Settings</h1>

      <div className="card">
        <h2 className="card-title">Model Configuration</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Speech-to-Text Model
          </label>
          <select style={{ 
            padding: '0.75rem', 
            width: '100%', 
            maxWidth: '400px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <option value="whisper-tiny">Whisper Tiny (75MB)</option>
            <option value="whisper-base" selected>Whisper Base (150MB)</option>
            <option value="whisper-small">Whisper Small (500MB)</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Sentiment Model
          </label>
          <select style={{ 
            padding: '0.75rem', 
            width: '100%', 
            maxWidth: '400px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <option value="distilbert">DistilBERT (250MB)</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Privacy Settings</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={piiRedaction}
              onChange={(e) => setPiiRedaction(e.target.checked)}
              style={{ marginRight: '0.75rem', width: '20px', height: '20px' }}
            />
            <span>Enable PII Redaction (phone numbers, SSN, credit cards)</span>
          </label>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Auto-delete audio files after (days)
          </label>
          <input
            type="number"
            value={autoDeleteDays}
            onChange={(e) => setAutoDeleteDays(parseInt(e.target.value))}
            min="1"
            max="365"
            style={{ 
              padding: '0.75rem', 
              width: '200px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Performance Settings</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Maximum Concurrent Calls
          </label>
          <input
            type="number"
            defaultValue={10}
            min="1"
            max="50"
            style={{ 
              padding: '0.75rem', 
              width: '200px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};

export default Settings;
