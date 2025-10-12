/**
 * TypeScript types matching backend Pydantic schemas
 * Generated from backend/app/schemas/*.py
 */

// User types
export interface UserRegisterRequest {
  name: string;
  email: string;
  role?: 'seller' | 'admin';
  metadata?: Record<string, any>;
}

export interface UserResponse {
  user_id: string;
  name: string;
  email: string;
  role: string;
  voice_trained: boolean;
  model_path: string | null;
  gmm_threshold: number | null;
  audio_retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceTrainingSample {
  phrase_number: number;
  audio_base64: string;
  duration: number;
}

export interface VoiceTrainingRequest {
  audio_samples: VoiceTrainingSample[];
}

export interface VoiceTrainingResponse {
  user_id: string;
  voice_trained: boolean;
  samples_count: number;
  model_accuracy: number;
  model_size_kb: number;
  calibrated_threshold: number;
}

export type VoiceVerificationOutcome =
  | 'match'
  | 'uncertain'
  | 'different_speaker'
  | 'audio_issue'
  | 'model_not_ready';

export interface VoiceVerificationRequest {
  audio_base64: string;
  source?: 'recording' | 'upload';
  duration?: number;
  filename?: string;
}

export interface VoiceVerificationResponse {
  outcome: VoiceVerificationOutcome;
  confidence: number;
  score: number | null;
  threshold: number | null;
  message: string;
  details: string;
  recommendations: string[];
}

export interface UserSettingsUpdate {
  audio_retention_days: number;
}

export interface UserSettingsResponse {
  user_id: string;
  audio_retention_days: number;
  updated_at: string;
}

// Call types
export interface EmotionScores {
  enthusiasm: number;
  agreement: number;
  stress: number;
}

export interface SegmentResponse {
  segment_id: number;
  segment_number: number;
  start_time: number;
  end_time: number;
  speaker: 'seller' | 'client';
  transcript: string | null;
  emotions: EmotionScores | null;
}

export interface AlertResponse {
  time: number;
  type: string;
  message: string;
  recommendation: string | null;
}

export interface CallSummary {
  total_segments: number;
  seller_segments: number;
  client_segments: number;
  avg_client_emotions: EmotionScores | null;
}

export interface CallDetails {
  id: string;
  user_id: string;
  filename: string;
  duration: number | null;
  detected_language: string | null;
  analyzed: boolean;
  uploaded_at: string;
  segments: SegmentResponse[];
  alerts: AlertResponse[];
  summary: CallSummary | null;
}

export interface CallListItem {
  id: string;
  filename: string;
  duration: number | null;
  detected_language: string | null;
  uploaded_at: string;
  analyzed: boolean;
  avg_client_emotions: EmotionScores | null;
}

export interface PaginationInfo {
  next_cursor: string | null;
  has_more: boolean;
  total: number;
}

export interface CallListResponse {
  data: CallListItem[];
  pagination: PaginationInfo;
}

export interface FeedbackRequest {
  segment_id: number;
  corrected_enthusiasm?: number;
  corrected_agreement?: number;
  corrected_stress?: number;
}

export interface FeedbackResponse {
  feedback_id: string;
  segment_id: number;
  accepted: boolean;
  total_feedback_count: number;
}

// Analysis types
export interface UploadInitRequest {
  user_id: string;
  filename: string;
  total_size_bytes: number;
  metadata?: Record<string, any>;
}

export interface UploadInitResponse {
  upload_id: string;
  chunk_size: number;
  call_id: string;
}

export interface ChunkUploadRequest {
  chunk_number: number;
  chunk_data: string;
  is_last: boolean;
}

export interface ChunkUploadResponse {
  upload_id: string;
  chunks_received: number;
  chunks_total: number | null;
  progress_percent: number;
}

export interface UploadCompleteResponse {
  call_id: string;
  status: 'processing' | 'queued';
  estimated_completion_seconds: number;
}

export interface TrainingStatusResponse {
  feedback_samples: Record<string, number>;
  training_threshold: number;
  models_trained: boolean;
  last_training_date: string | null;
  next_training_date: string | null;
  model_accuracy: Record<string, number> | null;
}

// Error types
export interface APIError {
  error: string;
  message: string;
  code?: string;
}
