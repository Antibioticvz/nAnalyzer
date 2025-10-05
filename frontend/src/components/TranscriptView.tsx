/**
 * TranscriptView component
 * Displays call transcript with speaker labels and emotion highlighting
 */
import React, { useState, useRef, useEffect } from 'react';
import { SegmentResponse } from '../types/api';

interface TranscriptViewProps {
  segments: SegmentResponse[];
  onSegmentClick?: (segment: SegmentResponse) => void;
  highlightedSegmentId?: number;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  segments,
  onSegmentClick,
  highlightedSegmentId,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedSegmentId !== undefined) {
      // Scroll to highlighted segment
      const element = document.getElementById(`segment-${highlightedSegmentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedSegmentId]);

  const handleSegmentClick = (segment: SegmentResponse) => {
    setSelectedSegment(segment.segment_id);
    onSegmentClick?.(segment);
  };

  const getEmotionColor = (emotions: SegmentResponse['emotions']) => {
    if (!emotions) return 'neutral';

    // Determine dominant emotion
    const { enthusiasm, agreement, stress } = emotions;
    
    if (stress > 7) return 'high-stress';
    if (enthusiasm > 7) return 'high-enthusiasm';
    if (agreement < 4) return 'low-agreement';
    if (enthusiasm < 4) return 'low-enthusiasm';
    
    return 'neutral';
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="transcript-view" ref={containerRef}>
      <div className="transcript-header">
        <h3>Call Transcript</h3>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color seller" />
            Seller
          </span>
          <span className="legend-item">
            <span className="legend-color client" />
            Client
          </span>
        </div>
      </div>

      <div className="transcript-content">
        {segments.length === 0 ? (
          <p className="empty-state">No transcript available yet.</p>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.segment_id}
              id={`segment-${segment.segment_id}`}
              className={`transcript-segment ${segment.speaker} ${
                getEmotionColor(segment.emotions)
              } ${
                selectedSegment === segment.segment_id ? 'selected' : ''
              } ${
                highlightedSegmentId === segment.segment_id ? 'highlighted' : ''
              }`}
              onClick={() => handleSegmentClick(segment)}
            >
              <div className="segment-header">
                <span className="speaker-label">
                  {segment.speaker === 'seller' ? '🎤 Seller' : '👤 Client'}
                </span>
                <span className="timestamp">
                  {formatTime(segment.start_time)}
                </span>
              </div>
              
              <div className="segment-text">
                {segment.transcript || '(No transcript)'}
              </div>

              {segment.emotions && segment.speaker === 'client' && (
                <div className="segment-emotions">
                  <span className="emotion-badge enthusiasm">
                    😊 {segment.emotions.enthusiasm.toFixed(1)}
                  </span>
                  <span className="emotion-badge agreement">
                    👍 {segment.emotions.agreement.toFixed(1)}
                  </span>
                  <span className="emotion-badge stress">
                    😰 {segment.emotions.stress.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
