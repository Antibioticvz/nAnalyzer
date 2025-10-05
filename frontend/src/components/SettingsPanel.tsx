/**
 * SettingsPanel component
 * User settings management interface
 */
import React, { useState, useEffect } from 'react';
import { UserResponse, UserSettingsUpdate } from '../types/api';
import { usersAPI } from '../services/usersAPI';

interface SettingsPanelProps {
  user: UserResponse;
  onUpdate?: (settings: UserSettingsUpdate) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  user,
  onUpdate,
}) => {
  const [retentionDays, setRetentionDays] = useState(user.audio_retention_days);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setRetentionDays(user.audio_retention_days);
  }, [user.audio_retention_days]);

  const handleSave = async () => {
    if (retentionDays < 1 || retentionDays > 90) {
      setSaveError('Retention period must be between 1 and 90 days');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await usersAPI.updateSettings(user.user_id, {
        audio_retention_days: retentionDays,
      });
      
      setSaveSuccess(true);
      onUpdate?.({ audio_retention_days: retentionDays });
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = retentionDays !== user.audio_retention_days;

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-section">
        <h3>User Information</h3>
        <div className="settings-info">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{user.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Role:</span>
            <span className="info-value">{user.role}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Voice Trained:</span>
            <span className="info-value">
              {user.voice_trained ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Audio Retention</h3>
        <p className="section-description">
          Audio files are automatically deleted after this period for privacy.
        </p>

        <div className="setting-control">
          <label htmlFor="retention-days">
            Retention Period (days)
          </label>
          <div className="retention-input-group">
            <input
              id="retention-days"
              type="number"
              min="1"
              max="90"
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value) || 1)}
              className="retention-input"
            />
            <span className="input-suffix">days</span>
          </div>
          <p className="input-hint">
            Valid range: 1-90 days. Current: {user.audio_retention_days} days
          </p>
        </div>
      </div>

      {saveError && (
        <div className="settings-error">
          <p>{saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="settings-success">
          <p>✅ Settings saved successfully!</p>
        </div>
      )}

      <div className="settings-actions">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="btn btn-primary"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {hasChanges && (
          <button
            onClick={() => setRetentionDays(user.audio_retention_days)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="settings-section">
        <h3>Privacy & Data</h3>
        <p className="privacy-info">
          🔒 All audio processing happens locally on your device. No data is
          sent to external services. Voice models are stored securely and only
          accessible by you.
        </p>
      </div>
    </div>
  );
};
