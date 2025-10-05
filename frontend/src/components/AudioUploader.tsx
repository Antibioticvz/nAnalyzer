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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file');
        return;
      }

      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File too large. Maximum size is 100MB');
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
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="audio-uploader">
      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="file-input"
        />
        
        {selectedFile && (
          <div className="file-info">
            <p><strong>File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}
      </div>

      {selectedFile && !isUploading && (
        <div className="upload-actions">
          <button onClick={handleUpload} className="btn btn-primary">
            Upload & Analyze
          </button>
          <button onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-text">{progress.toFixed(1)}%</p>
          <p className="progress-status">Uploading and processing...</p>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <p className="error-message">{error}</p>
          <button onClick={reset} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
