/**
 * Re-export all API services for backwards compatibility
 * This allows tests to import from 'services/api'
 */
export { analysisAPI } from './analysisAPI';
export { callsAPI } from './callsAPI';
export { usersAPI } from './usersAPI';
export { apiClient } from './apiClient';

// Re-export individual functions for convenience
export const initializeUpload = analysisAPI.initUpload;
export const uploadChunk = analysisAPI.uploadChunk;
export const completeUpload = analysisAPI.completeUpload;
