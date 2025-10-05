"""
Analysis API endpoints
POST /upload, POST /upload/{id}/chunk, POST /upload/{id}/complete
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import os
import base64
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.call import Call
from app.schemas.analysis import (
    UploadInitRequest,
    UploadInitResponse,
    ChunkUploadRequest,
    ChunkUploadResponse,
    UploadCompleteResponse
)

router = APIRouter(tags=["analysis"])

# In-memory storage for upload sessions (would use Redis in production)
upload_sessions = {}


@router.post("/upload", response_model=UploadInitResponse, status_code=201)
async def initialize_upload(
    request: UploadInitRequest,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Initialize chunked upload session"""
    # Verify user exists
    stmt = select(User).where(User.id == request.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check file size
    if request.total_size_bytes > 104857600:  # 100MB
        raise HTTPException(
            status_code=413,
            detail={"code": "AUDIO_TOO_LARGE", "message": "File exceeds 100MB limit"}
        )
    
    # Generate IDs
    upload_id = f"upload_{uuid.uuid4().hex[:16]}"
    call_id = f"call_{uuid.uuid4().hex[:16]}"
    
    # Create upload directory
    upload_dir = os.path.join(settings.DATA_DIR, "uploads", upload_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    # Create pending call record
    call = Call(
        id=call_id,
        user_id=request.user_id,
        filename=request.filename,
        file_size_bytes=request.total_size_bytes,
        status="uploading",
        call_metadata=request.metadata or {}
    )
    
    db.add(call)
    await db.commit()
    
    # Store upload session info
    upload_sessions[upload_id] = {
        "call_id": call_id,
        "user_id": request.user_id,
        "total_size": request.total_size_bytes,
        "chunks_received": 0,
        "upload_dir": upload_dir,
        "filename": request.filename
    }
    
    return UploadInitResponse(
        upload_id=upload_id,
        chunk_size=1048576,  # 1MB chunks
        call_id=call_id
    )


@router.post("/upload/{upload_id}/chunk", response_model=ChunkUploadResponse)
async def upload_chunk(
    upload_id: str,
    request: ChunkUploadRequest,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Upload a single audio chunk"""
    # Check if upload session exists
    if upload_id not in upload_sessions:
        raise HTTPException(
            status_code=404,
            detail={"code": "UPLOAD_NOT_FOUND", "message": "Upload session not found"}
        )
    
    session = upload_sessions[upload_id]
    
    # Decode and save chunk
    try:
        chunk_data = base64.b64decode(request.chunk_data)
        chunk_path = os.path.join(session["upload_dir"], f"chunk_{request.chunk_number:04d}")
        
        with open(chunk_path, "wb") as f:
            f.write(chunk_data)
        
        session["chunks_received"] += 1
        
        # Calculate progress
        if request.is_last:
            session["chunks_total"] = request.chunk_number + 1
        
        chunks_total = session.get("chunks_total")
        progress = (session["chunks_received"] / chunks_total * 100) if chunks_total else 0
        
        return ChunkUploadResponse(
            upload_id=upload_id,
            chunks_received=session["chunks_received"],
            chunks_total=chunks_total,
            progress_percent=progress
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"code": "CHUNK_UPLOAD_FAILED", "message": str(e)}
        )


@router.post("/upload/{upload_id}/complete", response_model=UploadCompleteResponse)
async def complete_upload(
    upload_id: str,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Complete upload and start analysis"""
    # Check if upload session exists
    if upload_id not in upload_sessions:
        raise HTTPException(
            status_code=404,
            detail={"code": "UPLOAD_NOT_FOUND", "message": "Upload session not found"}
        )
    
    session = upload_sessions[upload_id]
    call_id = session["call_id"]
    
    # Combine chunks into single file
    combined_path = os.path.join(settings.DATA_DIR, "audio", f"{call_id}.wav")
    os.makedirs(os.path.dirname(combined_path), exist_ok=True)
    
    try:
        with open(combined_path, "wb") as outfile:
            chunk_num = 0
            while True:
                chunk_path = os.path.join(session["upload_dir"], f"chunk_{chunk_num:04d}")
                if not os.path.exists(chunk_path):
                    break
                with open(chunk_path, "rb") as infile:
                    outfile.write(infile.read())
                chunk_num += 1
        
        # Update call record
        stmt = select(Call).where(Call.id == call_id)
        result = await db.execute(stmt)
        call = result.scalar_one_or_none()
        
        if call:
            call.status = "processing"
            call.audio_path = combined_path
            await db.commit()
        
        # Clean up upload session and chunks
        import shutil
        shutil.rmtree(session["upload_dir"], ignore_errors=True)
        del upload_sessions[upload_id]
        
        # Estimate completion time based on file size (rough estimate: 1:1 ratio)
        estimated_seconds = int(session["total_size"] / 32000)  # Assuming 16kHz, 16-bit mono
        
        return UploadCompleteResponse(
            call_id=call_id,
            status="processing",
            estimated_completion_seconds=estimated_seconds
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "UPLOAD_COMPLETION_FAILED", "message": str(e)}
        )
