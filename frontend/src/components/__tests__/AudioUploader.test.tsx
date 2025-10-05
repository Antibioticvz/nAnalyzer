/**
 * Frontend test: AudioUploader component
 * Test chunked upload logic with progress tracking
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioUploader } from '../AudioUploader';
import { analysisAPI } from '../../services/analysisAPI';

// Mock the analysis API
jest.mock('../../services/analysisAPI', () => ({
  analysisAPI: {
    initUpload: jest.fn(),
    uploadChunk: jest.fn(),
    completeUpload: jest.fn(),
  },
}));

describe('AudioUploader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload button', () => {
    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    const uploadLabel = screen.getByText(/choose file/i);
    expect(uploadLabel).toBeInTheDocument();
  });

  test('accepts file selection', async () => {
    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/test.wav/i)).toBeInTheDocument();
    });
  });

  test('shows progress during upload', async () => {
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

    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/start upload/i)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/start upload/i));
    
    await waitFor(() => {
      expect(analysisAPI.initUpload).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('calls onUploadComplete when done', async () => {
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
      call_id: 'test_call_123',
      status: 'completed',
    });
    
    const onComplete = jest.fn();

    render(<AudioUploader userId="test_user" onUploadComplete={onComplete} />);
    
    const file = new File(['audio'], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(await screen.findByText(/start upload/i));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('test_call_123');
    }, { timeout: 3000 });
  });

  test('validates file size (max 100MB)', async () => {
    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    // Create file larger than 100MB
    const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.wav', {
      type: 'audio/wav'
    });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    });
  });

  test('validates file format (WAV, MP3)', async () => {
    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
    });
  });
});
