"""
Pydantic schemas for User API
Request and response models
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Literal, Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = Field(default="seller", pattern="^(seller|admin)$")
    metadata: Optional[dict] = None


class UserLoginRequest(BaseModel):
    email: EmailStr


class UserLoginResponse(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    role: str
    voice_trained: bool
    model_path: Optional[str] = None
    gmm_threshold: Optional[float] = None
    audio_retention_days: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    role: str
    voice_trained: bool
    model_path: Optional[str] = None
    gmm_threshold: Optional[float] = None
    audio_retention_days: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VoiceTrainingSample(BaseModel):
    phrase_number: int = Field(..., ge=1, le=10)
    audio_base64: str
    duration: float = Field(..., gt=0)


class VoiceTrainingRequest(BaseModel):
    audio_samples: list[VoiceTrainingSample] = Field(..., min_length=5, max_length=10)


class VoiceTrainingResponse(BaseModel):
    user_id: str
    voice_trained: bool
    samples_count: int
    model_accuracy: float
    model_size_kb: int
    calibrated_threshold: float


class VoiceVerificationRequest(BaseModel):
    audio_base64: str
    source: Literal["recording", "upload"] = "recording"
    duration: Optional[float] = Field(default=None, gt=0)
    filename: Optional[str] = Field(default=None, max_length=255)


class VoiceVerificationResponse(BaseModel):
    outcome: Literal[
        "match",
        "uncertain",
        "different_speaker",
        "audio_issue",
        "model_not_ready",
    ]
    confidence: float = Field(ge=0, le=1)
    score: Optional[float] = None
    threshold: Optional[float] = None
    message: str
    details: str
    recommendations: list[str]


class UserSettingsUpdate(BaseModel):
    audio_retention_days: int = Field(..., ge=1, le=90)


class UserSettingsResponse(BaseModel):
    user_id: str
    audio_retention_days: int
    updated_at: datetime
