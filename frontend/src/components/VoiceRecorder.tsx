/**
 * VoiceRecorder component
 * Records audio from microphone for voice training
 */
import React, { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  phraseNumber: number;
  phraseText: string;
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  phraseNumber,
  phraseText,
  onRecordingComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        const duration = (Date.now() - startTimeRef.current) / 1000;
        onRecordingComplete(blob, duration);
        
        stream.getTracks().forEach((track) => track.stop());
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setRecordingTime(0);
    setError(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="voice-recorder">
      <div className="recorder-header">
        <h3>Phrase {phraseNumber}</h3>
      </div>

      <div className="phrase-display">
        <p className="phrase-text">"{phraseText}"</p>
        <p className="phrase-instruction">
          Read this phrase clearly when recording
        </p>
      </div>

      {error && (
        <div className="recorder-error">
          <p>{error}</p>
        </div>
      )}

      <div className="recorder-controls">
        {!isRecording && !audioURL && (
          <button
            onClick={startRecording}
            className="btn btn-primary btn-large"
          >
            🎤 Start Recording
          </button>
        )}

        {isRecording && (
          <>
            <div className="recording-indicator">
              <span className="recording-dot" />
              <span className="recording-time">{formatTime(recordingTime)}</span>
            </div>
            <button
              onClick={stopRecording}
              className="btn btn-danger btn-large"
            >
              ⏹ Stop Recording
            </button>
          </>
        )}

        {audioURL && (
          <div className="recording-preview">
            <audio src={audioURL} controls className="audio-player" />
            <div className="preview-actions">
              <button
                onClick={resetRecording}
                className="btn btn-secondary"
              >
                🔄 Re-record
              </button>
              <button
                onClick={onCancel}
                className="btn btn-secondary"
              >
                ✓ Use This Recording
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
