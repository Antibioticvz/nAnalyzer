/**
 * Upload service for chunked file uploads
 * Provides high-level upload functionality with progress tracking
 */
import { analysisAPI } from './analysisAPI';

const CHUNK_SIZE = 1048576; // 1MB

export interface UploadOptions {
  userId: string;
  file: File;
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

export interface UploadResult {
  callId: string;
  success: boolean;
  message: string;
}

/**
 * Upload a file in chunks with progress tracking
 */
export async function uploadChunked(options: UploadOptions): Promise<UploadResult> {
  const { userId, file, onProgress, onChunkComplete } = options;

  try {
    // Initialize upload
    const initResponse = await analysisAPI.initUpload({
      user_id: userId,
      filename: file.name,
      file_size: file.size,
      content_type: file.type,
    });

    const { upload_id, chunk_size } = initResponse;
    const totalChunks = Math.ceil(file.size / (chunk_size || CHUNK_SIZE));

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * (chunk_size || CHUNK_SIZE);
      const end = Math.min(start + (chunk_size || CHUNK_SIZE), file.size);
      const chunk = file.slice(start, end);

      // Convert chunk to base64
      const base64Chunk = await blobToBase64(chunk);

      // Upload chunk
      await analysisAPI.uploadChunk(upload_id, {
        chunk_index: chunkIndex,
        chunk_data: base64Chunk,
        is_final: chunkIndex === totalChunks - 1,
      });

      // Report progress
      const progress = ((chunkIndex + 1) / totalChunks) * 100;
      onProgress?.(progress);
      onChunkComplete?.(chunkIndex, totalChunks);
    }

    // Complete upload
    const completeResponse = await analysisAPI.completeUpload(upload_id);

    return {
      callId: completeResponse.call_id,
      success: true,
      message: 'Upload completed successfully',
    };
  } catch (error) {
    return {
      callId: '',
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/wav;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
