"""
Pydantic schemas for telemetry event ingestion and analytics queries.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Ingestion schemas
# ---------------------------------------------------------------------------

class TelemetryEvent(BaseModel):
    """A single behavioral event from the frontend."""
    session_id: str = Field(..., max_length=128)
    user_id: uuid.UUID | None = None
    event_type: str = Field(
        ...,
        max_length=64,
        description="e.g. page_view, item_clicked, add_to_cart, "
        "checkout_started, purchase_completed",
    )
    event_data: dict | None = None
    page_url: str | None = Field(None, max_length=2048)
    referrer_url: str | None = Field(None, max_length=2048)
    dwell_time_ms: int | None = Field(None, ge=0)
    device_type: str | None = Field(None, max_length=32)
    browser: str | None = Field(None, max_length=128)
    ip_address: str | None = Field(None, max_length=45)
    timestamp: datetime | None = Field(
        None, description="Client-side timestamp; server will also stamp created_at"
    )


class TelemetryBatch(BaseModel):
    """Batch of events sent in a single request for efficiency."""
    events: list[TelemetryEvent] = Field(..., min_length=1, max_length=500)


# ---------------------------------------------------------------------------
# Analytics query & response schemas
# ---------------------------------------------------------------------------

class AnalyticsQuery(BaseModel):
    """Query parameters for analytics endpoints."""
    start_date: datetime | None = None
    end_date: datetime | None = None
    event_type: str | None = None
    session_id: str | None = None
    user_id: uuid.UUID | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=500)


class AnalyticsBucket(BaseModel):
    """A single aggregation bucket."""
    label: str
    value: float
    count: int | None = None


class AnalyticsResponse(BaseModel):
    """Generic analytics response with aggregated data."""
    query: AnalyticsQuery | None = None
    total_events: int
    buckets: list[AnalyticsBucket] = []
    data: list[dict] | None = None
