/**
 * CallListItem component
 * Displays call preview in list view
 */
import React from 'react';
import { CallListItem as CallData } from '../types/api';

interface CallListItemProps {
  call: CallData;
  onClick?: (callId: string) => void;
}

export const CallListItem: React.FC<CallListItemProps> = ({ call, onClick }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (!call.analyzed) {
      return <span className="badge badge-processing">Processing...</span>;
    }
    return <span className="badge badge-complete">Analyzed</span>;
  };

  const getEmotionSummary = () => {
    if (!call.avg_client_emotions) {
      return <span className="text-muted">No emotion data</span>;
    }

    const { enthusiasm, agreement, stress } = call.avg_client_emotions;
    
    return (
      <div className="emotion-summary">
        <span className="emotion-mini enthusiasm">
          😊 {enthusiasm.toFixed(1)}
        </span>
        <span className="emotion-mini agreement">
          👍 {agreement.toFixed(1)}
        </span>
        <span className="emotion-mini stress">
          😰 {stress.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div
      className="call-list-item"
      onClick={() => onClick?.(call.id)}
    >
      <div className="call-item-header">
        <h4 className="call-filename">{call.filename}</h4>
        {getStatusBadge()}
      </div>

      <div className="call-item-meta">
        <span className="meta-item">
          📅 {formatDate(call.uploaded_at)}
        </span>
        <span className="meta-item">
          ⏱️ {formatDuration(call.duration)}
        </span>
        {call.detected_language && (
          <span className="meta-item">
            🌐 {call.detected_language.toUpperCase()}
          </span>
        )}
      </div>

      {call.analyzed && (
        <div className="call-item-emotions">
          {getEmotionSummary()}
        </div>
      )}
    </div>
  );
};
