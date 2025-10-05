/**
 * Users API service
 * Handles user registration, voice training, and settings
 */
import api, { apiClient } from './apiClient';
import {
  UserRegisterRequest,
  UserResponse,
  VoiceTrainingRequest,
  VoiceTrainingResponse,
  UserSettingsUpdate,
  UserSettingsResponse,
} from '../types/api';

export const usersAPI = {
  /**
   * Register new user
   */
  register: async (data: UserRegisterRequest): Promise<UserResponse> => {
    const response = await api.post<UserResponse>('/api/v1/users/register', data);
    
    // Auto-set user ID for subsequent requests
    apiClient.setUserId(response.data.user_id);
    
    return response.data;
  },

  /**
   * Train voice model with audio samples
   */
  trainVoice: async (
    userId: string,
    data: VoiceTrainingRequest
  ): Promise<VoiceTrainingResponse> => {
    const response = await api.post<VoiceTrainingResponse>(
      `/api/v1/users/${userId}/train-voice`,
      data
    );
    return response.data;
  },

  /**
   * Get user information
   */
  getUser: async (userId: string): Promise<UserResponse> => {
    const response = await api.get<UserResponse>(`/api/v1/users/${userId}`);
    return response.data;
  },

  /**
   * Update user settings
   */
  updateSettings: async (
    userId: string,
    data: UserSettingsUpdate
  ): Promise<UserSettingsResponse> => {
    const response = await api.put<UserSettingsResponse>(
      `/api/v1/users/${userId}/settings`,
      data
    );
    return response.data;
  },
};
