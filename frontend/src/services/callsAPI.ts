/**
 * Calls API service
 * Handles call retrieval, feedback submission, and deletion
 */
import api from './apiClient';
import {
  CallListResponse,
  CallDetails,
  SegmentResponse,
  FeedbackRequest,
  FeedbackResponse,
} from '../types/api';

export const callsAPI = {
  /**
   * List user's calls with pagination
   */
  listCalls: async (params?: {
    limit?: number;
    cursor?: string;
  }): Promise<CallListResponse> => {
    const response = await api.get<CallListResponse>('/api/v1/calls', { params });
    return response.data;
  },

  /**
   * Get call details with segments and alerts
   */
  getCall: async (callId: string): Promise<CallDetails> => {
    const response = await api.get<CallDetails>(`/api/v1/calls/${callId}`);
    return response.data;
  },

  /**
   * Get call segments only
   */
  getSegments: async (callId: string): Promise<SegmentResponse[]> => {
    const response = await api.get<SegmentResponse[]>(
      `/api/v1/calls/${callId}/segments`
    );
    return response.data;
  },

  /**
   * Submit emotion feedback for a segment
   */
  submitFeedback: async (
    callId: string,
    data: FeedbackRequest
  ): Promise<FeedbackResponse> => {
    const response = await api.post<FeedbackResponse>(
      `/api/v1/calls/${callId}/feedback`,
      data
    );
    return response.data;
  },

  /**
   * Delete a call
   */
  deleteCall: async (callId: string): Promise<void> => {
    await api.delete(`/api/v1/calls/${callId}`);
  },
};
