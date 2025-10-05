"""
Configuration API endpoints
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class ConfigResponse(BaseModel):
    stt_model: str
    sentiment_model: str
    auto_delete_days: int
    pii_redaction_enabled: bool


class ConfigUpdateRequest(BaseModel):
    auto_delete_days: Optional[int] = None
    pii_redaction_enabled: Optional[bool] = None


@router.get("/", response_model=ConfigResponse)
async def get_config():
    """Get current configuration"""
    from app.core.config import settings
    
    return ConfigResponse(
        stt_model=settings.STT_MODEL,
        sentiment_model=settings.SENTIMENT_MODEL,
        auto_delete_days=settings.AUTO_DELETE_AUDIO_DAYS,
        pii_redaction_enabled=settings.ENABLE_PII_REDACTION
    )


@router.put("/", response_model=ConfigResponse)
async def update_config(request: ConfigUpdateRequest):
    """Update configuration"""
    # TODO: Implement configuration updates
    logger.info(f"Updating configuration: {request.dict(exclude_none=True)}")
    return await get_config()


@router.get("/models")
async def list_models():
    """List available models"""
    return {
        "stt_models": [
            {"name": "whisper-tiny", "size_mb": 75},
            {"name": "whisper-base", "size_mb": 150},
            {"name": "whisper-small", "size_mb": 500}
        ],
        "sentiment_models": [
            {"name": "distilbert-base-uncased-finetuned-sst-2-english", "size_mb": 250}
        ]
    }
