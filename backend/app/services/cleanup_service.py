"""
Cleanup service - Background task for audio retention policy
Per spec: Auto-delete audio files based on user retention settings
"""
from datetime import datetime, timedelta
from pathlib import Path
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.call import Call
from app.models.user import User
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CleanupService:
    """Service for automatic audio file cleanup"""
    
    async def cleanup_expired_audio(self, db: AsyncSession) -> int:
        """
        Delete audio files that have passed retention period
        
        Args:
            db: Database session
        
        Returns:
            Number of files cleaned up
        """
        now = datetime.utcnow()
        cleaned_count = 0
        
        # Find calls where auto_delete_at has passed
        stmt = select(Call).where(
            Call.auto_delete_at <= now,
            Call.audio_deleted == False
        )
        
        result = await db.execute(stmt)
        calls_to_clean = result.scalars().all()
        
        for call in calls_to_clean:
            try:
                # Delete physical audio file
                if call.audio_path:
                    audio_file = Path(call.audio_path)
                    if audio_file.exists():
                        audio_file.unlink()
                        logger.info(f"Deleted audio file: {call.audio_path}")
                
                # Mark as deleted in database
                call.audio_deleted = True
                call.audio_path = None
                cleaned_count += 1
                
            except Exception as e:
                logger.error(f"Failed to delete audio for call {call.id}: {e}")
        
        await db.commit()
        
        logger.info(f"Cleanup completed: {cleaned_count} files deleted")
        return cleaned_count
    
    async def update_auto_delete_schedule(
        self,
        db: AsyncSession,
        call_id: str,
        retention_days: int
    ) -> None:
        """
        Update auto-delete schedule for a call
        
        Args:
            db: Database session
            call_id: Call ID
            retention_days: Number of days to retain (1-90)
        """
        stmt = select(Call).where(Call.id == call_id)
        result = await db.execute(stmt)
        call = result.scalar_one_or_none()
        
        if call:
            call.auto_delete_at = call.uploaded_at + timedelta(days=retention_days)
            await db.commit()
    
    async def get_cleanup_stats(self, db: AsyncSession) -> dict:
        """
        Get statistics about pending cleanups
        
        Returns:
            Dictionary with cleanup statistics
        """
        now = datetime.utcnow()
        
        # Count calls pending deletion
        stmt = select(Call).where(
            Call.auto_delete_at <= now,
            Call.audio_deleted == False
        )
        result = await db.execute(stmt)
        pending_count = len(result.scalars().all())
        
        # Count already deleted
        stmt = select(Call).where(Call.audio_deleted == True)
        result = await db.execute(stmt)
        deleted_count = len(result.scalars().all())
        
        # Calculate total storage used
        stmt = select(Call).where(
            Call.audio_deleted == False,
            Call.audio_path.isnot(None)
        )
        result = await db.execute(stmt)
        active_calls = result.scalars().all()
        
        total_size = 0
        for call in active_calls:
            if call.audio_path:
                try:
                    total_size += Path(call.audio_path).stat().st_size
                except Exception:
                    pass
        
        return {
            'pending_deletion': pending_count,
            'already_deleted': deleted_count,
            'total_storage_bytes': total_size,
            'total_storage_mb': total_size / (1024 * 1024)
        }
    
    def cleanup_orphaned_files(self) -> int:
        """
        Remove orphaned files in upload/audio directories
        Not referenced in database
        
        Returns:
            Number of orphaned files removed
        """
        cleaned = 0
        
        # This would require database query to get all valid paths
        # For now, just a placeholder
        # In production, you'd query all Call.audio_path and delete files not in that list
        
        logger.info(f"Orphaned files cleanup: {cleaned} files removed")
        return cleaned


# Singleton
_cleanup_service: CleanupService = None


def get_cleanup_service() -> CleanupService:
    """Get or create cleanup service singleton"""
    global _cleanup_service
    if _cleanup_service is None:
        _cleanup_service = CleanupService()
    return _cleanup_service
