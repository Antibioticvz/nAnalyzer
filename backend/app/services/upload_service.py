"""
Upload service - Handle chunked audio uploads
Per spec: 1MB chunks, streaming to reduce memory
"""
import os
import uuid
import base64
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.core.config import settings


class UploadSession:
    """Represents an active upload session"""
    
    def __init__(self, upload_id: str, user_id: str, filename: str, total_size: int):
        self.upload_id = upload_id
        self.user_id = user_id
        self.filename = filename
        self.total_size = total_size
        self.chunks_received = 0
        self.temp_file_path: Optional[Path] = None
        self.created_at = datetime.utcnow()
        self.chunks: Dict[int, bytes] = {}
    
    def is_expired(self, timeout_minutes: int = 30) -> bool:
        """Check if session expired"""
        return (datetime.utcnow() - self.created_at) > timedelta(minutes=timeout_minutes)


class UploadService:
    """Service for managing chunked uploads"""
    
    def __init__(self):
        self.active_sessions: Dict[str, UploadSession] = {}
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def initialize_upload(
        self,
        user_id: str,
        filename: str,
        total_size_bytes: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Initialize new chunked upload session
        
        Args:
            user_id: User ID
            filename: Original filename
            total_size_bytes: Total file size
            metadata: Optional metadata
        
        Returns:
            Dictionary with upload_id, chunk_size, call_id
        """
        # Validate size
        max_size = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024
        if total_size_bytes > max_size:
            raise ValueError(f"File too large: {total_size_bytes} > {max_size}")
        
        # Generate IDs
        upload_id = f"upload_{uuid.uuid4().hex[:16]}"
        call_id = f"call_{uuid.uuid4().hex[:16]}"
        
        # Create session
        session = UploadSession(upload_id, user_id, filename, total_size_bytes)
        
        # Create temp file path
        temp_filename = f"{upload_id}_{filename}"
        session.temp_file_path = self.upload_dir / temp_filename
        
        # Store session
        self.active_sessions[upload_id] = session
        
        # Return info
        chunk_size = settings.CHUNK_SIZE_MB * 1024 * 1024  # 1MB
        
        return {
            'upload_id': upload_id,
            'chunk_size': chunk_size,
            'call_id': call_id
        }
    
    def upload_chunk(
        self,
        upload_id: str,
        chunk_number: int,
        chunk_data: str,
        is_last: bool
    ) -> Dict[str, Any]:
        """
        Upload a single chunk
        
        Args:
            upload_id: Upload session ID
            chunk_number: Chunk index (0-based)
            chunk_data: Base64 encoded chunk
            is_last: Whether this is the final chunk
        
        Returns:
            Progress information
        """
        # Get session
        session = self.active_sessions.get(upload_id)
        if not session:
            raise ValueError(f"Upload session not found: {upload_id}")
        
        # Check expiration
        if session.is_expired():
            self.cleanup_session(upload_id)
            raise ValueError(f"Upload session expired: {upload_id}")
        
        # Decode chunk
        try:
            chunk_bytes = base64.b64decode(chunk_data)
        except Exception as e:
            raise ValueError(f"Invalid base64 chunk data: {e}")
        
        # Store chunk in memory (for now - could stream directly to file)
        session.chunks[chunk_number] = chunk_bytes
        session.chunks_received += 1
        
        # Calculate progress
        received_bytes = sum(len(chunk) for chunk in session.chunks.values())
        progress_percent = (received_bytes / session.total_size) * 100 if session.total_size > 0 else 0
        
        # If last chunk, write to file
        if is_last:
            self._write_chunks_to_file(session)
        
        return {
            'upload_id': upload_id,
            'chunks_received': session.chunks_received,
            'chunks_total': None,  # Don't know until last chunk
            'progress_percent': progress_percent
        }
    
    def _write_chunks_to_file(self, session: UploadSession) -> None:
        """Write all chunks to temporary file"""
        if not session.temp_file_path:
            raise ValueError("No temp file path set")
        
        # Sort chunks by number and write
        sorted_chunks = sorted(session.chunks.items())
        
        with open(session.temp_file_path, 'wb') as f:
            for _, chunk_data in sorted_chunks:
                f.write(chunk_data)
        
        # Clear chunks from memory
        session.chunks.clear()
    
    def complete_upload(self, upload_id: str) -> Dict[str, Any]:
        """
        Mark upload as complete and return file path
        
        Args:
            upload_id: Upload session ID
        
        Returns:
            Dictionary with file_path and session info
        """
        session = self.active_sessions.get(upload_id)
        if not session:
            raise ValueError(f"Upload session not found: {upload_id}")
        
        # Check if file exists
        if not session.temp_file_path or not session.temp_file_path.exists():
            raise ValueError(f"Upload file not found for session: {upload_id}")
        
        # Return file info
        return {
            'upload_id': upload_id,
            'user_id': session.user_id,
            'filename': session.filename,
            'file_path': str(session.temp_file_path),
            'file_size': os.path.getsize(session.temp_file_path)
        }
    
    def cleanup_session(self, upload_id: str) -> None:
        """Remove upload session and temporary files"""
        session = self.active_sessions.get(upload_id)
        
        if session:
            # Delete temp file if exists
            if session.temp_file_path and session.temp_file_path.exists():
                try:
                    session.temp_file_path.unlink()
                except Exception:
                    pass
            
            # Remove from active sessions
            del self.active_sessions[upload_id]
    
    def cleanup_expired_sessions(self) -> int:
        """
        Cleanup all expired sessions
        
        Returns:
            Number of sessions cleaned up
        """
        expired = [
            upload_id
            for upload_id, session in self.active_sessions.items()
            if session.is_expired()
        ]
        
        for upload_id in expired:
            self.cleanup_session(upload_id)
        
        return len(expired)


# Singleton instance
_upload_service: Optional[UploadService] = None


def get_upload_service() -> UploadService:
    """Get or create upload service singleton"""
    global _upload_service
    if _upload_service is None:
        _upload_service = UploadService()
    return _upload_service
