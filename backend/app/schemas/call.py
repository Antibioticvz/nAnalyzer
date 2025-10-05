"""
Pydantic schemas for Call API
Request and response models
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class EmotionScores(BaseModel):
    enthusiasm: float = Field(..., ge=0, le=10)
    agreement: float = Field(..., ge=0, le=10)
    stress: float = Field(..., ge=0, le=10)


class SegmentResponse(BaseModel):
    segment_id: int
    segment_number: int
    start_time: float
    end_time: float
    speaker: str = Field(..., pattern="^(seller|client)$")
    transcript: Optional[str] = None
    emotions: Optional[EmotionScores] = None

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    time: float
    type: str
    message: str
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True


class CallSummary(BaseModel):
    total_segments: int
    seller_segments: int
    client_segments: int
    avg_client_emotions: Optional[EmotionScores] = None


class CallDetails(BaseModel):
    id: str
    user_id: str
    filename: str
    duration: Optional[float] = None
    detected_language: Optional[str] = None
    analyzed: bool
    uploaded_at: datetime
    segments: List[SegmentResponse] = []
    alerts: List[AlertResponse] = []
    summary: Optional[CallSummary] = None

    class Config:
        from_attributes = True


class CallListItem(BaseModel):
    id: str
    filename: str
    duration: Optional[float] = None
    detected_language: Optional[str] = None
    uploaded_at: datetime
    analyzed: bool
    avg_client_emotions: Optional[EmotionScores] = None

    class Config:
        from_attributes = True


class PaginationInfo(BaseModel):
    next_cursor: Optional[str] = None
    has_more: bool
    total: int


class CallListResponse(BaseModel):
    data: List[CallListItem]
    pagination: PaginationInfo


class FeedbackRequest(BaseModel):
    segment_id: int
    corrected_enthusiasm: Optional[float] = Field(None, ge=0, le=10)
    corrected_agreement: Optional[float] = Field(None, ge=0, le=10)
    corrected_stress: Optional[float] = Field(None, ge=0, le=10)


class FeedbackResponse(BaseModel):
    feedback_id: str
    segment_id: int
    accepted: bool
    total_feedback_count: int
