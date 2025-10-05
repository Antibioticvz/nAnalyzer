/**
 * useChunkedUpload hook
 * Manages chunked file upload with progress tracking
 */
import { useState, useCallback, useRef } from 'react';
import { analysisAPI } from '../services/analysisAPI';

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB

interface UploadProgress {
  uploadId: string | null;
  callId: string | null;
  progress: number;
  isUploading: boolean;
  error: string | null;
}

export const useChunkedUpload = () => {
  const [uploadState, setUploadState] = useState<UploadProgress>({
    uploadId: null,
    callId: null,
    progress: 0,
    isUploading: false,
    error: null,
  });
  
  const cancelledRef = useRef(false);

  const upload = useCallback(
    async (file: File, userId: string): Promise<string | null> => {
      cancelledRef.current = false;
      
      try {
        setUploadState({
          uploadId: null,
          callId: null,
          progress: 0,
          isUploading: true,
          error: null,
        });

        // Initialize upload
        const initResponse = await analysisAPI.initUpload({
          user_id: userId,
          filename: file.name,
          total_size_bytes: file.size,
        });
        
        if (cancelledRef.current) {
          return null;
        }

        setUploadState((prev) => ({
          ...prev,
          uploadId: initResponse.upload_id,
          callId: initResponse.call_id,
        }));

        // Calculate chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        
        // Upload chunks
        for (let i = 0; i < totalChunks; i++) {
          if (cancelledRef.current) {
            setUploadState((prev) => ({
              ...prev,
              isUploading: false,
            }));
            return null;
          }
          
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          
          // Convert chunk to base64
          const base64Chunk = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(chunk);
          });

          // Upload chunk
          const chunkResponse = await analysisAPI.uploadChunk(
            initResponse.upload_id,
            {
              chunk_number: i,
              chunk_data: base64Chunk,
              is_last: i === totalChunks - 1,
            }
          );

          // Update progress
          setUploadState((prev) => ({
            ...prev,
            progress: chunkResponse.progress_percent,
          }));
        }
        
        if (cancelledRef.current) {
          return null;
        }

        // Complete upload
        const completeResponse = await analysisAPI.completeUpload(
          initResponse.upload_id
        );

        setUploadState((prev) => ({
          ...prev,
          progress: 100,
          isUploading: false,
        }));

        return completeResponse.call_id;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    []
  );

  const uploadFile = upload; // Alias for compatibility
  
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setUploadState((prev) => ({
      ...prev,
      isUploading: false,
    }));
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setUploadState({
      uploadId: null,
      callId: null,
      progress: 0,
      isUploading: false,
      error: null,
    });
  }, []);

  return {
    ...uploadState,
    upload,
    uploadFile,
    cancel,
    reset,
  };
};
