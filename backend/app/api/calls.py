"""
Calls API endpoints
GET /, GET /{id}, GET /{id}/segments, POST /{id}/feedback, DELETE /{id}
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.database import get_db
from app.models.call import Call
from app.models.segment import Segment
from app.models.alert import Alert
from app.models.feedback import EmotionFeedback
from app.schemas.call import (
    CallListResponse,
    CallListItem,
    PaginationInfo,
    CallDetails,
    SegmentResponse,
    AlertResponse,
    EmotionScores,
    CallSummary,
    FeedbackRequest,
    FeedbackResponse
)

router = APIRouter(prefix="/api/v1/calls", tags=["calls"])


@router.get("", response_model=CallListResponse)
async def list_calls(
    x_user_id: str = Header(..., alias="X-User-ID"),
    limit: int = Query(50, ge=1, le=100),
    cursor: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List user's calls with pagination"""
    stmt = select(Call).where(Call.user_id == x_user_id).order_by(Call.uploaded_at.desc()).limit(limit)
    
    if cursor:
        stmt = stmt.where(Call.id < cursor)
    
    result = await db.execute(stmt)
    calls = result.scalars().all()
    
    count_stmt = select(func.count(Call.id)).where(Call.user_id == x_user_id)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0
    
    items = []
    for call in calls:
        avg_emotions = None
        if call.analyzed:
            segments_stmt = select(Segment).where(
                Segment.call_id == call.id,
                Segment.speaker == "client",
                Segment.enthusiasm.isnot(None)
            )
            seg_result = await db.execute(segments_stmt)
            client_segments = seg_result.scalars().all()
            
            if client_segments:
                avg_emotions = EmotionScores(
                    enthusiasm=sum(s.enthusiasm for s in client_segments if s.enthusiasm) / len(client_segments),
                    agreement=sum(s.agreement for s in client_segments if s.agreement) / len(client_segments),
                    stress=sum(s.stress for s in client_segments if s.stress) / len(client_segments)
                )
        
        items.append(CallListItem(
            id=call.id,
            filename=call.filename,
            duration=call.duration,
            detected_language=call.detected_language,
            uploaded_at=call.uploaded_at,
            analyzed=call.analyzed,
            avg_client_emotions=avg_emotions
        ))
    
    has_more = len(calls) == limit
    next_cursor = calls[-1].id if has_more and calls else None
    
    return CallListResponse(
        data=items,
        pagination=PaginationInfo(next_cursor=next_cursor, has_more=has_more, total=total)
    )


@router.get("/{call_id}", response_model=CallDetails)
async def get_call(
    call_id: str,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get call details"""
    stmt = select(Call).where(Call.id == call_id, Call.user_id == x_user_id)
    result = await db.execute(stmt)
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": "Call not found"})
    
    segments_stmt = select(Segment).where(Segment.call_id == call_id).order_by(Segment.segment_number)
    seg_result = await db.execute(segments_stmt)
    segments = seg_result.scalars().all()
    
    alerts_stmt = select(Alert).where(Alert.call_id == call_id).order_by(Alert.timestamp)
    alert_result = await db.execute(alerts_stmt)
    alerts = alert_result.scalars().all()
    
    segment_responses = []
    for seg in segments:
        emotions = EmotionScores(enthusiasm=seg.enthusiasm, agreement=seg.agreement, stress=seg.stress) if seg.enthusiasm is not None else None
        segment_responses.append(SegmentResponse(
            segment_id=seg.id, segment_number=seg.segment_number,
            start_time=seg.start_time, end_time=seg.end_time,
            speaker=seg.speaker, transcript=seg.transcript, emotions=emotions
        ))
    
    alert_responses = [AlertResponse(time=a.timestamp, type=a.alert_type, message=a.message, recommendation=a.recommendation) for a in alerts]
    
    client_segments = [s for s in segments if s.speaker == "client"]
    seller_segments = [s for s in segments if s.speaker == "seller"]
    client_with_emotions = [s for s in client_segments if s.enthusiasm is not None]
    
    avg_emotions = EmotionScores(
        enthusiasm=sum(s.enthusiasm for s in client_with_emotions) / len(client_with_emotions),
        agreement=sum(s.agreement for s in client_with_emotions) / len(client_with_emotions),
        stress=sum(s.stress for s in client_with_emotions) / len(client_with_emotions)
    ) if client_with_emotions else None
    
    summary = CallSummary(
        total_segments=len(segments),
        seller_segments=len(seller_segments),
        client_segments=len(client_segments),
        avg_client_emotions=avg_emotions
    )
    
    return CallDetails(
        id=call.id, user_id=call.user_id, filename=call.filename,
        duration=call.duration, detected_language=call.detected_language,
        analyzed=call.analyzed, uploaded_at=call.uploaded_at,
        segments=segment_responses, alerts=alert_responses, summary=summary
    )


@router.get("/{call_id}/segments", response_model=list[SegmentResponse])
async def get_call_segments(
    call_id: str,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Get segments"""
    call_stmt = select(Call).where(Call.id == call_id, Call.user_id == x_user_id)
    call_result = await db.execute(call_stmt)
    if not call_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Call not found")
    
    stmt = select(Segment).where(Segment.call_id == call_id).order_by(Segment.segment_number)
    result = await db.execute(stmt)
    segments = result.scalars().all()
    
    return [
        SegmentResponse(
            segment_id=s.id, segment_number=s.segment_number,
            start_time=s.start_time, end_time=s.end_time,
            speaker=s.speaker, transcript=s.transcript,
            emotions=EmotionScores(enthusiasm=s.enthusiasm, agreement=s.agreement, stress=s.stress) if s.enthusiasm else None
        ) for s in segments
    ]


@router.post("/{call_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    call_id: str,
    request: FeedbackRequest,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback"""
    stmt = select(Segment).where(Segment.id == request.segment_id)
    result = await db.execute(stmt)
    segment = result.scalar_one_or_none()
    
    if not segment or segment.call_id != call_id:
        raise HTTPException(status_code=404, detail="Segment not found")
    
    feedback = EmotionFeedback(
        segment_id=request.segment_id, user_id=x_user_id,
        original_enthusiasm=segment.enthusiasm, corrected_enthusiasm=request.corrected_enthusiasm,
        original_agreement=segment.agreement, corrected_agreement=request.corrected_agreement,
        original_stress=segment.stress, corrected_stress=request.corrected_stress,
        used_for_training=False
    )
    
    db.add(feedback)
    await db.commit()
    
    count_stmt = select(func.count(EmotionFeedback.id))
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0
    
    return FeedbackResponse(feedback_id=str(feedback.id), segment_id=request.segment_id, accepted=True, total_feedback_count=total)


@router.delete("/{call_id}", status_code=204)
async def delete_call(
    call_id: str,
    x_user_id: str = Header(..., alias="X-User-ID"),
    db: AsyncSession = Depends(get_db)
):
    """Delete call"""
    stmt = select(Call).where(Call.id == call_id, Call.user_id == x_user_id)
    result = await db.execute(stmt)
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if call.audio_path:
        from pathlib import Path
        try:
            Path(call.audio_path).unlink(missing_ok=True)
        except: pass
    
    await db.delete(call)
    await db.commit()
