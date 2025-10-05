/**
 * Frontend test: useChunkedUpload hook
 * Test chunked upload logic and state management
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChunkedUpload } from '../../hooks/useChunkedUpload';
import * as api from '../../services/api';

jest.mock('../../services/api');

describe('useChunkedUpload Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useChunkedUpload());
    
    expect(result.current.isUploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  test('uploads file in chunks', async () => {
    const mockInitUpload = jest.spyOn(api, 'initializeUpload').mockResolvedValue({
      upload_id: 'upload_123',
      chunk_size: 1048576
    });
    
    const mockUploadChunk = jest.spyOn(api, 'uploadChunk').mockResolvedValue({
      upload_id: 'upload_123',
      chunks_received: 1,
      progress_percent: 100
    });
    
    const mockCompleteUpload = jest.spyOn(api, 'completeUpload').mockResolvedValue({
      call_id: 'call_123',
      status: 'processing'
    });

    const { result } = renderHook(() => useChunkedUpload());
    
    const file = new File(['test data'], 'test.wav', { type: 'audio/wav' });
    
    await act(async () => {
      await result.current.upload(file, 'user_123');
    });

    expect(mockInitUpload).toHaveBeenCalled();
    expect(mockUploadChunk).toHaveBeenCalled();
    expect(mockCompleteUpload).toHaveBeenCalled();
  });

  test('tracks progress during upload', async () => {
    jest.spyOn(api, 'initializeUpload').mockResolvedValue({
      upload_id: 'upload_123',
      chunk_size: 1048576
    });
    
    jest.spyOn(api, 'uploadChunk').mockResolvedValue({
      upload_id: 'upload_123',
      chunks_received: 1,
      progress_percent: 50
    });

    const { result } = renderHook(() => useChunkedUpload());
    
    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'test.wav');
    
    act(() => {
      result.current.upload(file, 'user_123');
    });

    await waitFor(() => {
      expect(result.current.progress).toBeGreaterThan(0);
    });
  });

  test('handles upload errors', async () => {
    jest.spyOn(api, 'initializeUpload').mockRejectedValue(
      new Error('Upload failed')
    );

    const { result } = renderHook(() => useChunkedUpload());
    
    const file = new File(['data'], 'test.wav');
    
    await act(async () => {
      try {
        await result.current.upload(file, 'user_123');
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isUploading).toBe(false);
  });

  test('can cancel upload', async () => {
    const { result } = renderHook(() => useChunkedUpload());
    
    const file = new File(['data'], 'test.wav');
    
    act(() => {
      result.current.upload(file, 'user_123');
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isUploading).toBe(false);
  });
});
