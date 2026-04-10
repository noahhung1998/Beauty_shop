"""
Telemetry event ingestion and admin query routes.

The POST endpoint is designed for high-throughput batch inserts.
In production, consider buffering events in Redis and flushing
to PostgreSQL in bulk via a Celery periodic task.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_admin
from app.models.telemetry import UserEvent
from app.models.user import User
from app.schemas.telemetry import TelemetryBatch, TelemetryEvent

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post(
    "/events",
    status_code=status.HTTP_201_CREATED,
    summary="Batch-insert telemetry events",
)
async def ingest_events(
    batch: TelemetryBatch,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Accept a batch of behavioral events for analytics.

    This endpoint is intentionally unauthenticated so the frontend
    can fire events for anonymous visitors.  IP addresses can be
    populated server-side for abuse detection.

    Returns the count of events inserted.
    """
    models = []
    for event in batch.events:
        models.append(
            UserEvent(
                session_id=event.session_id,
                user_id=event.user_id,
                event_type=event.event_type,
                event_data=event.event_data,
                page_url=event.page_url,
                referrer_url=event.referrer_url,
                dwell_time_ms=event.dwell_time_ms,
                device_type=event.device_type,
                browser=event.browser,
                ip_address=event.ip_address,
            )
        )
    db.add_all(models)
    await db.flush()
    return {"inserted": len(models)}


@router.get(
    "/events",
    summary="Query telemetry events (admin)",
)
async def query_events(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    event_type: str | None = Query(None),
    session_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
) -> dict:
    """Query raw telemetry events with optional filters (admin only)."""
    query = select(UserEvent)

    if event_type:
        query = query.where(UserEvent.event_type == event_type)
    if session_id:
        query = query.where(UserEvent.session_id == session_id)

    # Total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Fetch page
    offset = (page - 1) * page_size
    query = query.order_by(UserEvent.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    events = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "events": [
            {
                "id": e.id,
                "session_id": e.session_id,
                "user_id": str(e.user_id) if e.user_id else None,
                "event_type": e.event_type,
                "event_data": e.event_data,
                "page_url": e.page_url,
                "referrer_url": e.referrer_url,
                "dwell_time_ms": e.dwell_time_ms,
                "device_type": e.device_type,
                "browser": e.browser,
                "ip_address": e.ip_address,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
    }
