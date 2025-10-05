"""
Users API endpoints
POST /register, POST /train-voice, GET /{id}, PUT /{id}/settings
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegisterRequest,
    UserResponse,
    VoiceTrainingRequest,
    VoiceTrainingResponse,
    UserSettingsUpdate,
    UserSettingsResponse
)
from app.ml.speaker_id import train_user_voice_model, save_model
from app.core.config import settings
import base64
import os

router = APIRouter(tags=["users"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register_user(
    request: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register new user"""
    # Check if email already exists
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail={"error": "ConflictError", "message": "Email already exists"}
        )
    
    # Create new user
    user_id = f"user_{uuid.uuid4().hex[:16]}"
    
    user = User(
        id=user_id,
        name=request.name,
        email=request.email,
        role=request.role,
        voice_trained=False,
        audio_retention_days=settings.DEFAULT_RETENTION_DAYS
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        voice_trained=user.voice_trained,
        model_path=user.model_path,
        gmm_threshold=user.gmm_threshold,
        audio_retention_days=user.audio_retention_days,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.post("/{user_id}/train-voice", response_model=VoiceTrainingResponse)
async def train_voice(
    user_id: str,
    request: VoiceTrainingRequest,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Train GMM voice model for user"""
    # Verify user exists
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate number of samples
    if len(request.audio_samples) < 5 or len(request.audio_samples) > 10:
        raise HTTPException(
            status_code=400,
            detail={"error": "ValidationError", "message": "Need 5-10 audio samples"}
        )
    
    # Decode audio samples
    audio_bytes_list = []
    for sample in request.audio_samples:
        try:
            audio_bytes = base64.b64decode(sample.audio_base64)
            audio_bytes_list.append(audio_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail={"error": "ValidationError", "message": f"Invalid audio data: {e}"}
            )
    
    # Train GMM model
    try:
        user_model = train_user_voice_model(audio_bytes_list, sample_rate=16000)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "TrainingError", "message": f"Failed to train model: {e}"}
        )
    
    # Save model
    model_dir = os.path.join(settings.MODELS_DIR, "voice")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, f"{user_id}.pkl")
    
    save_model(user_model, model_path)
    
    # Get model file size
    model_size_kb = os.path.getsize(model_path) // 1024
    
    # Update user record
    user.voice_trained = True
    user.model_path = model_path
    user.gmm_threshold = user_model['threshold']
    
    await db.commit()
    
    return VoiceTrainingResponse(
        user_id=user_id,
        voice_trained=True,
        samples_count=len(request.audio_samples),
        model_accuracy=0.9,  # Placeholder - would need validation set
        model_size_kb=model_size_kb,
        calibrated_threshold=user_model['threshold']
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get user information"""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": "User not found"}
        )
    
    return UserResponse(
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        voice_trained=user.voice_trained,
        model_path=user.model_path,
        gmm_threshold=user.gmm_threshold,
        audio_retention_days=user.audio_retention_days,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.put("/{user_id}/settings", response_model=UserSettingsResponse)
async def update_settings(
    user_id: str,
    request: UserSettingsUpdate,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Update user settings"""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate retention period
    if request.audio_retention_days < 1 or request.audio_retention_days > 90:
        raise HTTPException(
            status_code=400,
            detail={"error": "ValidationError", "message": "Retention must be 1-90 days"}
        )
    
    # Update settings
    user.audio_retention_days = request.audio_retention_days
    await db.commit()
    await db.refresh(user)
    
    return UserSettingsResponse(
        user_id=user_id,
        audio_retention_days=user.audio_retention_days,
        updated_at=user.updated_at
    )
