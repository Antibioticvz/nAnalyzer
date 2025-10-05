/**
 * Re-export all API services for backwards compatibility
 * This allows tests to import from 'services/api'
 */
import { analysisAPI } from './analysisAPI';
import { callsAPI } from './callsAPI';
import { usersAPI } from './usersAPI';
import { apiClient } from './apiClient';

export { analysisAPI, callsAPI, usersAPI, apiClient };

// Re-export individual functions for convenience
export const initializeUpload = analysisAPI.initUpload;
export const uploadChunk = analysisAPI.uploadChunk;
export const completeUpload = analysisAPI.completeUpload;
