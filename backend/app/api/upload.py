"""
Upload API endpoints
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class UploadResponse(BaseModel):
    call_id: str
    filename: str
    size_bytes: int
    status: str


@router.post("/", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file for analysis"""
    # Validate file type
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # TODO: Implement file upload and processing
    logger.info(f"Uploading file: {file.filename}")
    
    # Read file content
    content = await file.read()
    
    return UploadResponse(
        call_id="call_uploaded_123",
        filename=file.filename,
        size_bytes=len(content),
        status="processing"
    )
