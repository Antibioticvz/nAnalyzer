"""
Users API endpoints
POST /register, POST /train-voice, GET /{id}, PUT /{id}/settings
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegisterRequest,
    UserResponse,
    UserLoginRequest,
    UserLoginResponse,
    VoiceTrainingRequest,
    VoiceTrainingResponse,
    VoiceVerificationRequest,
    VoiceVerificationResponse,
    UserSettingsUpdate,
    UserSettingsResponse,
)
from app.ml.speaker_id import (
    train_user_voice_model,
    save_model,
    load_model,
    extract_features_from_audio_bytes,
)
from app.core.config import settings
import base64
import os
from typing import Tuple

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


@router.post("/login", response_model=UserLoginResponse)
async def login_user(
    request: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login user by email"""
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFoundError", "message": "User not found"}
        )
    
    return UserLoginResponse(
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


def _classify_margin(margin: float) -> Tuple[str, float]:
    """Map score/threshold margin to outcome label and confidence."""
    if margin >= 8:
        return "match", min(0.99, 0.75 + (margin / 40))
    if margin >= 0:
        return "match", 0.65 + (margin / 40)
    if margin > -5:
        return "uncertain", max(0.35, 0.5 + (margin / 20))
    return "different_speaker", max(0.05, 0.15 + (margin / 20))


def _build_response_metadata(outcome: str) -> Tuple[str, list[str]]:
    if outcome == "match":
        return (
            "✅ It's you!",
            [
                "Speaker diarization will confidently attribute segments to you.",
                "Save this clip for a future regression test if needed.",
            ],
        )
    if outcome == "uncertain":
        return (
            "🤔 Borderline match",
            [
                "Try recording again with less background noise.",
                "Consider retraining your voice model with a few fresh samples.",
            ],
        )
    if outcome == "different_speaker":
        return (
            "⚠️ Voice does not match",
            [
                "Verify the correct user is logged in before analysis.",
                "Retrain your model if your voice has changed significantly.",
            ],
        )
    if outcome == "audio_issue":
        return (
            "🎧 We couldn't analyze the clip",
            [
                "Record at least three seconds of clear speech.",
                "Avoid uploading encrypted or unsupported audio formats.",
            ],
        )
    return (
        "ℹ️ Voice model not ready",
        [
            "Complete the voice training workflow to generate a personal model.",
            "Once trained, you can return here to validate new audio snippets.",
        ],
    )


@router.post("/{user_id}/verify-voice", response_model=VoiceVerificationResponse)
async def verify_voice(
    user_id: str,
    request: VoiceVerificationRequest,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Verify whether an audio clip matches the user's trained voice model."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.voice_trained or not user.model_path:
        message, recommendations = _build_response_metadata("model_not_ready")
        return VoiceVerificationResponse(
            outcome="model_not_ready",
            confidence=0.0,
            score=None,
            threshold=None,
            message=message,
            details="Voice model not trained for this user.",
            recommendations=recommendations,
        )

    if request.duration is not None and request.duration < 1.0:
        message, recommendations = _build_response_metadata("audio_issue")
        return VoiceVerificationResponse(
            outcome="audio_issue",
            confidence=0.0,
            score=None,
            threshold=user.gmm_threshold,
            message=message,
            details="Recording is too short. Provide at least one second of speech.",
            recommendations=recommendations,
        )

    try:
        audio_bytes = base64.b64decode(request.audio_base64)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "InvalidAudio",
                "message": f"Audio payload must be base64-encoded WAV: {exc}",
            },
        ) from exc

    if not audio_bytes:
        message, recommendations = _build_response_metadata("audio_issue")
        return VoiceVerificationResponse(
            outcome="audio_issue",
            confidence=0.0,
            score=None,
            threshold=user.gmm_threshold,
            message=message,
            details="Empty audio payload received.",
            recommendations=recommendations,
        )

    try:
        user_model = load_model(user.model_path)
    except FileNotFoundError:
        message, recommendations = _build_response_metadata("model_not_ready")
        return VoiceVerificationResponse(
            outcome="model_not_ready",
            confidence=0.0,
            score=None,
            threshold=None,
            message=message,
            details="Trained model file could not be found.",
            recommendations=recommendations,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "ModelLoadError",
                "message": f"Failed to load trained voice model: {exc}",
            },
        ) from exc

    try:
        features = extract_features_from_audio_bytes(
            audio_bytes,
            target_sample_rate=settings.SAMPLE_RATE,
        )
    except ValueError as exc:
        message, recommendations = _build_response_metadata("audio_issue")
        return VoiceVerificationResponse(
            outcome="audio_issue",
            confidence=0.0,
            score=None,
            threshold=user.gmm_threshold,
            message=message,
            details=str(exc),
            recommendations=recommendations,
        )

    gmm = user_model.get("gmm")
    threshold = user_model.get("threshold", user.gmm_threshold)

    if gmm is None or threshold is None:
        message, recommendations = _build_response_metadata("model_not_ready")
        return VoiceVerificationResponse(
            outcome="model_not_ready",
            confidence=0.0,
            score=None,
            threshold=None,
            message=message,
            details="Voice model is missing calibration data.",
            recommendations=recommendations,
        )

    score = gmm.score(features)
    margin = score - float(threshold)
    outcome, confidence = _classify_margin(margin)
    message, recommendations = _build_response_metadata(outcome)

    details = (
        f"Log-likelihood score {score:.2f} vs threshold {float(threshold):.2f}. "
        f"Margin {margin:.2f}."
    )

    return VoiceVerificationResponse(
        outcome=outcome,
        confidence=round(confidence, 3),
        score=float(score),
        threshold=float(threshold),
        message=message,
        details=details,
        recommendations=recommendations,
    )
