/**
 * Analysis API service
 * Handles chunked upload and analysis operations
 */
import api from './apiClient';
import {
  UploadInitRequest,
  UploadInitResponse,
  ChunkUploadRequest,
  ChunkUploadResponse,
  UploadCompleteResponse,
  TrainingStatusResponse,
} from '../types/api';

export const analysisAPI = {
  /**
   * Initialize chunked upload
   */
  initUpload: async (data: UploadInitRequest): Promise<UploadInitResponse> => {
    const response = await api.post<UploadInitResponse>(
      '/api/v1/analysis/upload',
      data
    );
    return response.data;
  },

  /**
   * Upload a chunk
   */
  uploadChunk: async (
    uploadId: string,
    data: ChunkUploadRequest
  ): Promise<ChunkUploadResponse> => {
    const response = await api.post<ChunkUploadResponse>(
      `/api/v1/analysis/upload/${uploadId}/chunk`,
      data
    );
    return response.data;
  },

  /**
   * Complete upload and trigger analysis
   */
  completeUpload: async (uploadId: string): Promise<UploadCompleteResponse> => {
    const response = await api.post<UploadCompleteResponse>(
      `/api/v1/analysis/upload/${uploadId}/complete`
    );
    return response.data;
  },

  /**
   * Get training status for RandomForest models
   */
  getTrainingStatus: async (): Promise<TrainingStatusResponse> => {
    const response = await api.get<TrainingStatusResponse>(
      '/api/v1/analysis/training-status'
    );
    return response.data;
  },
};
