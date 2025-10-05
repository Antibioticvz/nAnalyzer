"""
Frontend test: AudioUploader component
Test chunked upload logic with progress tracking
"""
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioUploader } from '../../components/AudioUploader';
import { uploadChunked } from '../../services/uploadService';

// Mock the upload service
jest.mock('../../services/uploadService');

describe('AudioUploader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload button', () => {
    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    const uploadButton = screen.getByText(/upload/i);
    expect(uploadButton).toBeInTheDocument();
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
    const mockUpload = uploadChunked as jest.MockedFunction<typeof uploadChunked>;
    mockUpload.mockImplementation((file, userId, onProgress) => {
      // Simulate progress
      onProgress(50);
      return Promise.resolve({ call_id: 'test_call' });
    });

    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/start upload/i));
    
    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  test('calls onUploadComplete when done', async () => {
    const mockUpload = uploadChunked as jest.MockedFunction<typeof uploadChunked>;
    const onComplete = jest.fn();
    
    mockUpload.mockResolvedValue({ call_id: 'test_call_123' });

    render(<AudioUploader userId="test_user" onUploadComplete={onComplete} />);
    
    const file = new File(['audio'], 'test.wav', { type: 'audio/wav' });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByText(/start upload/i));
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('test_call_123');
    });
  });

  test('validates file size (max 100MB)', () => {
    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    // Create file larger than 100MB
    const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.wav', {
      type: 'audio/wav'
    });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  test('validates file format (WAV, MP3)', () => {
    render(<AudioUploader userId="test_user" onUploadComplete={jest.fn()} />);
    
    const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/choose file/i);
    
    fireEvent.change(input, { target: { files: [invalidFile] } });
    
    expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
  });
});
