/**
 * AlertsList component
 * Displays analysis alerts with recommendations
 */
import React from 'react';
import { AlertResponse } from '../types/api';

interface AlertsListProps {
  alerts: AlertResponse[];
  onAlertClick?: (alert: AlertResponse) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({
  alerts,
  onAlertClick,
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlertIcon = (type: string): string => {
    const icons: Record<string, string> = {
      high_stress: '⚠️',
      low_enthusiasm: '😐',
      high_enthusiasm: '🎉',
      low_agreement: '❌',
      high_agreement: '✅',
    };
    return icons[type] || 'ℹ️';
  };

  const getAlertClass = (type: string): string => {
    if (type.includes('high_stress') || type.includes('low_agreement')) {
      return 'alert-warning';
    }
    if (type.includes('high_enthusiasm') || type.includes('high_agreement')) {
      return 'alert-success';
    }
    return 'alert-info';
  };

  if (alerts.length === 0) {
    return (
      <div className="alerts-list empty">
        <p>No alerts for this call. Everything looks good! ✅</p>
      </div>
    );
  }

  return (
    <div className="alerts-list">
      <h3>Analysis Alerts</h3>
      <div className="alerts-container">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`alert-item ${getAlertClass(alert.type)}`}
            onClick={() => onAlertClick?.(alert)}
          >
            <div className="alert-header">
              <span className="alert-icon">{getAlertIcon(alert.type)}</span>
              <span className="alert-time">{formatTime(alert.time)}</span>
            </div>
            
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
              {alert.recommendation && (
                <p className="alert-recommendation">
                  <strong>💡 Recommendation:</strong> {alert.recommendation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
