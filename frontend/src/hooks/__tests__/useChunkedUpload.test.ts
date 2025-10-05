/**
 * Frontend test: useChunkedUpload hook
 * Test chunked upload logic and state management
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChunkedUpload } from '../useChunkedUpload';
import { analysisAPI } from '../../services/analysisAPI';

jest.mock('../../services/analysisAPI', () => ({
  analysisAPI: {
    initUpload: jest.fn(),
    uploadChunk: jest.fn(),
    completeUpload: jest.fn(),
  },
}));

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
    (analysisAPI.initUpload as jest.Mock).mockResolvedValue({
      upload_id: 'upload_123',
      call_id: 'call_123',
      chunk_size: 1048576,
    });
    
    (analysisAPI.uploadChunk as jest.Mock).mockResolvedValue({
      upload_id: 'upload_123',
      chunks_received: 1,
      progress_percent: 100,
    });
    
    (analysisAPI.completeUpload as jest.Mock).mockResolvedValue({
      call_id: 'call_123',
      status: 'processing',
    });

    const { result } = renderHook(() => useChunkedUpload());
    
    const file = new File(['test data'], 'test.wav', { type: 'audio/wav' });
    
    await act(async () => {
      await result.current.upload(file, 'user_123');
    });

    expect(analysisAPI.initUpload).toHaveBeenCalled();
    expect(analysisAPI.uploadChunk).toHaveBeenCalled();
    expect(analysisAPI.completeUpload).toHaveBeenCalled();
  });

  test('tracks progress during upload', async () => {
    (analysisAPI.initUpload as jest.Mock).mockResolvedValue({
      upload_id: 'upload_123',
      call_id: 'call_123',
      chunk_size: 1048576,
    });
    
    (analysisAPI.uploadChunk as jest.Mock).mockResolvedValue({
      upload_id: 'upload_123',
      chunks_received: 1,
      progress_percent: 50,
    });
    
    (analysisAPI.completeUpload as jest.Mock).mockResolvedValue({
      call_id: 'call_123',
      status: 'processing',
    });

    const { result } = renderHook(() => useChunkedUpload());
    
    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'test.wav');
    
    let uploadPromise: Promise<string | null>;
    act(() => {
      uploadPromise = result.current.upload(file, 'user_123');
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(true);
    });
    
    await act(async () => {
      await uploadPromise;
    });
  });

  test('handles upload errors', async () => {
    (analysisAPI.initUpload as jest.Mock).mockRejectedValue(
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
    (analysisAPI.initUpload as jest.Mock).mockResolvedValue({
      upload_id: 'upload_123',
      call_id: 'call_123',
      chunk_size: 1048576,
    });
    
    // Make upload chunk slow to allow cancellation
    (analysisAPI.uploadChunk as jest.Mock).mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve({
        upload_id: 'upload_123',
        chunks_received: 1,
        progress_percent: 50,
      }), 100))
    );

    const { result } = renderHook(() => useChunkedUpload());
    
    const file = new File(['x'.repeat(5 * 1024 * 1024)], 'test.wav');
    
    act(() => {
      result.current.upload(file, 'user_123');
    });
    
    await waitFor(() => {
      expect(result.current.isUploading).toBe(true);
    });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => {
      expect(result.current.isUploading).toBe(false);
    });
  });
});
