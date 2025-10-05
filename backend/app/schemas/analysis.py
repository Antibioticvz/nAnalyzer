"""
Pydantic schemas for Analysis API
Request and response models for upload and analysis
"""
from pydantic import BaseModel, Field
from typing import Optional


class UploadInitRequest(BaseModel):
    user_id: str
    filename: str
    total_size_bytes: int = Field(..., gt=0, le=104857600)  # Max 100MB
    metadata: Optional[dict] = None


class UploadInitResponse(BaseModel):
    upload_id: str
    chunk_size: int
    call_id: str


class ChunkUploadRequest(BaseModel):
    chunk_number: int = Field(..., ge=0)
    chunk_data: str  # Base64 encoded
    is_last: bool


class ChunkUploadResponse(BaseModel):
    upload_id: str
    chunks_received: int
    chunks_total: Optional[int] = None
    progress_percent: float


class UploadCompleteResponse(BaseModel):
    call_id: str
    status: str = Field(..., pattern="^(processing|queued)$")
    estimated_completion_seconds: int


class TrainingStatusResponse(BaseModel):
    feedback_samples: dict
    training_threshold: int
    models_trained: bool
    last_training_date: Optional[str] = None
    next_training_date: Optional[str] = None
    model_accuracy: Optional[dict] = None
