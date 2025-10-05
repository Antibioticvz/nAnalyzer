/**
 * EmotionFeedback component
 * Interface for correcting emotion scores
 */
import React, { useState } from 'react';
import { SegmentResponse, FeedbackRequest } from '../types/api';

interface EmotionFeedbackProps {
  segment: SegmentResponse;
  onSubmit: (feedback: FeedbackRequest) => void;
  onCancel: () => void;
}

export const EmotionFeedback: React.FC<EmotionFeedbackProps> = ({
  segment,
  onSubmit,
  onCancel,
}) => {
  const [enthusiasm, setEnthusiasm] = useState(
    segment.emotions?.enthusiasm ?? 5
  );
  const [agreement, setAgreement] = useState(
    segment.emotions?.agreement ?? 5
  );
  const [stress, setStress] = useState(segment.emotions?.stress ?? 5);

  const handleSubmit = () => {
    onSubmit({
      segment_id: segment.segment_id,
      corrected_enthusiasm: enthusiasm,
      corrected_agreement: agreement,
      corrected_stress: stress,
    });
  };

  const hasChanges = () => {
    if (!segment.emotions) return true;
    return (
      enthusiasm !== segment.emotions.enthusiasm ||
      agreement !== segment.emotions.agreement ||
      stress !== segment.emotions.stress
    );
  };

  return (
    <div className="emotion-feedback">
      <div className="feedback-header">
        <h3>Correct Emotion Scores</h3>
        <p className="feedback-description">
          Adjust the scores below if you think the analysis was inaccurate.
          Your feedback helps improve future predictions.
        </p>
      </div>

      <div className="segment-preview">
        <p className="segment-text">{segment.transcript}</p>
        <span className="segment-speaker">
          {segment.speaker === 'client' ? '👤 Client' : '🎤 Seller'}
        </span>
      </div>

      <div className="feedback-sliders">
        <div className="slider-group">
          <label>
            😊 Enthusiasm
            <span className="slider-value">{enthusiasm.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={enthusiasm}
            onChange={(e) => setEnthusiasm(parseFloat(e.target.value))}
            className="slider enthusiasm"
          />
          <div className="slider-labels">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <div className="slider-group">
          <label>
            👍 Agreement
            <span className="slider-value">{agreement.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={agreement}
            onChange={(e) => setAgreement(parseFloat(e.target.value))}
            className="slider agreement"
          />
          <div className="slider-labels">
            <span>Disagree</span>
            <span>Agree</span>
          </div>
        </div>

        <div className="slider-group">
          <label>
            😰 Stress
            <span className="slider-value">{stress.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={stress}
            onChange={(e) => setStress(parseFloat(e.target.value))}
            className="slider stress"
          />
          <div className="slider-labels">
            <span>Calm</span>
            <span>Stressed</span>
          </div>
        </div>
      </div>

      <div className="feedback-actions">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={!hasChanges()}
        >
          Submit Correction
        </button>
      </div>

      {segment.emotions && (
        <div className="original-scores">
          <p className="text-muted">
            Original: 😊 {segment.emotions.enthusiasm.toFixed(1)} | 👍{' '}
            {segment.emotions.agreement.toFixed(1)} | 😰{' '}
            {segment.emotions.stress.toFixed(1)}
          </p>
        </div>
      )}
    </div>
  );
};
