"""
Pydantic schemas for shipment tracking and carrier webhook payloads.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ShipmentCreate(BaseModel):
    """Create a shipment record for an order."""
    order_id: uuid.UUID
    carrier: str = Field(..., description="One of: correos, seur, dhl, other")
    tracking_number: str | None = Field(None, max_length=128)
    estimated_delivery_date: date | None = None


class ShipmentUpdate(BaseModel):
    """Admin manual update of shipment tracking info."""
    status: str | None = Field(None, description="Shipment status enum value")
    current_location: str | None = Field(None, max_length=256)
    current_location_detail: str | None = None
    estimated_delivery_date: date | None = None
    tracking_number: str | None = Field(None, max_length=128)


class TrackingEvent(BaseModel):
    """Single event in the tracking history."""
    timestamp: datetime
    location: str | None = None
    status: str
    detail: str | None = None


class CarrierWebhookPayload(BaseModel):
    """Normalized webhook payload from any carrier.

    Each carrier adapter is responsible for mapping the raw carrier
    payload into this common structure before processing.
    """
    carrier: str
    tracking_number: str
    status: str
    location: str | None = None
    location_detail: str | None = None
    event_timestamp: datetime | None = None
    estimated_delivery_date: date | None = None
    raw_payload: dict | None = Field(
        None, description="Original carrier payload preserved for debugging"
    )


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    carrier: str
    tracking_number: str | None
    status: str
    current_location: str | None
    current_location_detail: str | None
    estimated_delivery_date: date | None
    actual_delivery_date: datetime | None
    last_carrier_update: datetime | None
    tracking_history: list[TrackingEvent] | None = None
    created_at: datetime
    updated_at: datetime
