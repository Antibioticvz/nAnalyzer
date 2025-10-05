/**
 * AudioUploader component
 * Handles file selection and chunked upload with progress
 */
import React, { useState, useRef } from 'react';
import { useChunkedUpload } from '../hooks/useChunkedUpload';

interface AudioUploaderProps {
  userId: string;
  onUploadComplete?: (callId: string) => void;
  onUploadError?: (error: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  userId,
  onUploadComplete,
  onUploadError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { progress, isUploading, error, uploadFile, reset } = useChunkedUpload();

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setValidationError(null);
    
    if (file) {
      // Validate file type (audio formats)
      const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3)$/i)) {
        setValidationError('Invalid format. Please upload WAV or MP3 files only.');
        return;
      }

      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        setValidationError('File too large. Maximum size is 100MB.');
        return;
      }

      setSelectedFile(file);
      reset();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const callId = await uploadFile(selectedFile, userId);
    
    if (callId) {
      onUploadComplete?.(callId);
    } else if (error) {
      onUploadError?.(error);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setValidationError(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="audio-uploader">
      <div className="upload-section">
        <label htmlFor="audio-file-input" className="file-input-label">
          Choose File
          <input
            id="audio-file-input"
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="file-input"
            aria-label="Choose file"
          />
        </label>
        
        {selectedFile && (
          <div className="file-info">
            <p><strong>File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}
        
        {validationError && (
          <div className="validation-error" role="alert">
            <p className="error-message">{validationError}</p>
          </div>
        )}
      </div>

      {selectedFile && !isUploading && !validationError && (
        <div className="upload-actions">
          <button onClick={handleUpload} className="btn btn-primary">
            Start Upload
          </button>
          <button onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-text">{Math.round(progress)}%</p>
          <p className="progress-status">Uploading and processing...</p>
        </div>
      )}

      {error && (
        <div className="upload-error" role="alert">
          <p className="error-message">{error}</p>
          <button onClick={reset} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
