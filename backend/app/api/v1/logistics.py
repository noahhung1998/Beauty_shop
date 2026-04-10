"""
Logistics / shipment routes -- tracking queries, admin updates,
and carrier webhook receivers.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_admin, get_current_user
from app.models.user import User
from app.schemas.shipment import (
    CarrierWebhookPayload,
    ShipmentCreate,
    ShipmentResponse,
    ShipmentUpdate,
)
from app.services.logistics_service import LogisticsService

router = APIRouter(tags=["Logistics"])


# ---------------------------------------------------------------------------
# Shipment queries
# ---------------------------------------------------------------------------

@router.get(
    "/shipments/{order_id}",
    response_model=list[ShipmentResponse],
    summary="Get shipments for an order",
)
async def get_shipments(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> list:
    """Return all shipments associated with the given order."""
    service = LogisticsService(db)
    shipments = await service.get_shipment_by_order(order_id)
    return shipments


@router.post(
    "/shipments",
    response_model=ShipmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a shipment (admin)",
)
async def create_shipment(
    data: ShipmentCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> object:
    """Create a new shipment record for an order (admin only)."""
    service = LogisticsService(db)
    try:
        shipment = await service.create_shipment(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return shipment


# ---------------------------------------------------------------------------
# Admin tracking updates
# ---------------------------------------------------------------------------

@router.put(
    "/shipments/{shipment_id}/tracking",
    response_model=ShipmentResponse,
    summary="Update shipment tracking (admin)",
)
async def update_tracking(
    shipment_id: uuid.UUID,
    data: ShipmentUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> object:
    """Manually update shipment location, status, or ETA (admin only)."""
    service = LogisticsService(db)
    try:
        shipment = await service.update_tracking(shipment_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return shipment


# ---------------------------------------------------------------------------
# Carrier webhooks (unauthenticated -- carriers hit these directly)
# ---------------------------------------------------------------------------

@router.post(
    "/webhooks/carrier/{carrier_name}",
    status_code=status.HTTP_200_OK,
    summary="Receive carrier tracking webhook",
)
async def carrier_webhook(
    carrier_name: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Endpoint for Correos, SEUR, or DHL to push tracking updates.

    The raw JSON body is parsed into our normalized
    ``CarrierWebhookPayload`` structure and processed by the logistics
    service.

    Returns ``{"status": "ok"}`` to acknowledge receipt even if the
    tracking number is unknown (to prevent retries from the carrier).
    """
    valid_carriers = {"correos", "seur", "dhl"}
    if carrier_name.lower() not in valid_carriers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown carrier '{carrier_name}'. Supported: {', '.join(valid_carriers)}",
        )

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON body",
        )

    # Build normalized payload -- in production each carrier would have
    # its own adapter to map the raw payload fields.
    payload = CarrierWebhookPayload(
        carrier=carrier_name.lower(),
        tracking_number=body.get("tracking_number", ""),
        status=body.get("status", ""),
        location=body.get("location"),
        location_detail=body.get("location_detail"),
        event_timestamp=body.get("event_timestamp"),
        estimated_delivery_date=body.get("estimated_delivery_date"),
        raw_payload=body,
    )

    service = LogisticsService(db)
    await service.process_carrier_webhook(payload)

    # Always return 200 to the carrier to prevent retries
    return {"status": "ok"}
