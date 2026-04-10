"""
Logistics service -- shipment creation, tracking updates, and carrier
webhook processing for Correos, SEUR, and DHL.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.shipment import Carrier, Shipment, ShipmentStatus
from app.schemas.shipment import CarrierWebhookPayload, ShipmentCreate, ShipmentUpdate

logger = logging.getLogger(__name__)

# Map carrier webhook status strings to our internal ShipmentStatus enum.
# Each carrier uses different terminology; this normalizes them.
_CARRIER_STATUS_MAP: dict[str, dict[str, ShipmentStatus]] = {
    "correos": {
        "PRE": ShipmentStatus.label_created,
        "REC": ShipmentStatus.picked_up,
        "ENV": ShipmentStatus.in_transit,
        "REP": ShipmentStatus.out_for_delivery,
        "ENT": ShipmentStatus.delivered,
        "DEV": ShipmentStatus.returned,
        "INC": ShipmentStatus.exception,
    },
    "seur": {
        "GRABADO": ShipmentStatus.label_created,
        "RECOGIDO": ShipmentStatus.picked_up,
        "EN TRANSITO": ShipmentStatus.in_transit,
        "EN REPARTO": ShipmentStatus.out_for_delivery,
        "ENTREGADO": ShipmentStatus.delivered,
        "DEVUELTO": ShipmentStatus.returned,
        "INCIDENCIA": ShipmentStatus.exception,
    },
    "dhl": {
        "pre-transit": ShipmentStatus.label_created,
        "picked-up": ShipmentStatus.picked_up,
        "transit": ShipmentStatus.in_transit,
        "out-for-delivery": ShipmentStatus.out_for_delivery,
        "delivered": ShipmentStatus.delivered,
        "returned": ShipmentStatus.returned,
        "failure": ShipmentStatus.exception,
    },
}


class LogisticsService:
    """Manages shipment lifecycle and carrier integrations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_shipment(self, data: ShipmentCreate) -> Shipment:
        """Create a new shipment record for an order.

        Raises:
            ValueError: If the order does not exist.
        """
        # Validate the order exists
        result = await self.db.execute(
            select(Order).where(Order.id == data.order_id)
        )
        order = result.scalar_one_or_none()
        if order is None:
            raise ValueError(f"Order {data.order_id} not found")

        shipment = Shipment(
            order_id=data.order_id,
            carrier=Carrier(data.carrier),
            tracking_number=data.tracking_number,
            estimated_delivery_date=data.estimated_delivery_date,
            status=ShipmentStatus.label_created,
            tracking_history=[],
        )
        self.db.add(shipment)
        await self.db.flush()
        await self.db.refresh(shipment)
        logger.info(
            "Shipment %s created for order %s (carrier=%s)",
            shipment.id,
            data.order_id,
            data.carrier,
        )
        return shipment

    # ------------------------------------------------------------------
    # Manual tracking update (admin)
    # ------------------------------------------------------------------

    async def update_tracking(
        self,
        shipment_id: uuid.UUID,
        update: ShipmentUpdate,
    ) -> Shipment:
        """Manually update shipment tracking info (admin operation).

        Raises:
            ValueError: If the shipment is not found.
        """
        shipment = await self._get_or_404(shipment_id)
        now = datetime.now(timezone.utc)

        if update.status is not None:
            new_status = ShipmentStatus(update.status)
            shipment.status = new_status

            # Append to history
            history_entry = {
                "timestamp": now.isoformat(),
                "location": update.current_location or shipment.current_location,
                "status": new_status.value,
                "detail": update.current_location_detail,
            }
            history = list(shipment.tracking_history or [])
            history.append(history_entry)
            shipment.tracking_history = history

            # Mark delivery if applicable
            if new_status == ShipmentStatus.delivered:
                shipment.actual_delivery_date = now

        if update.current_location is not None:
            shipment.current_location = update.current_location
        if update.current_location_detail is not None:
            shipment.current_location_detail = update.current_location_detail
        if update.estimated_delivery_date is not None:
            shipment.estimated_delivery_date = update.estimated_delivery_date
        if update.tracking_number is not None:
            shipment.tracking_number = update.tracking_number

        shipment.last_carrier_update = now

        await self.db.flush()
        await self.db.refresh(shipment)
        logger.info("Shipment %s updated manually", shipment.id)
        return shipment

    # ------------------------------------------------------------------
    # Carrier webhook processing
    # ------------------------------------------------------------------

    async def process_carrier_webhook(
        self,
        payload: CarrierWebhookPayload,
    ) -> Shipment | None:
        """Process an incoming webhook from a logistics carrier.

        The payload has already been normalized by the API layer.

        Returns:
            The updated Shipment, or None if the tracking number is unknown.
        """
        # Look up the shipment by tracking number
        result = await self.db.execute(
            select(Shipment).where(
                Shipment.tracking_number == payload.tracking_number
            )
        )
        shipment = result.scalar_one_or_none()
        if shipment is None:
            logger.warning(
                "Received webhook for unknown tracking number: %s",
                payload.tracking_number,
            )
            return None

        # Normalize the carrier-specific status to our enum
        carrier_key = payload.carrier.lower()
        status_map = _CARRIER_STATUS_MAP.get(carrier_key, {})
        new_status = status_map.get(
            payload.status, ShipmentStatus.in_transit  # safe default
        )

        now = payload.event_timestamp or datetime.now(timezone.utc)

        shipment.status = new_status
        if payload.location:
            shipment.current_location = payload.location
        if payload.location_detail:
            shipment.current_location_detail = payload.location_detail
        if payload.estimated_delivery_date:
            shipment.estimated_delivery_date = payload.estimated_delivery_date
        shipment.last_carrier_update = now

        # Mark delivery
        if new_status == ShipmentStatus.delivered:
            shipment.actual_delivery_date = now
            # Also update the order status
            order_result = await self.db.execute(
                select(Order).where(Order.id == shipment.order_id)
            )
            order = order_result.scalar_one_or_none()
            if order and order.status in (
                OrderStatus.shipped,
                OrderStatus.in_transit,
            ):
                order.status = OrderStatus.delivered

        # Append to tracking history
        history_entry = {
            "timestamp": now.isoformat(),
            "location": payload.location,
            "status": new_status.value,
            "detail": payload.location_detail,
        }
        history = list(shipment.tracking_history or [])
        history.append(history_entry)
        shipment.tracking_history = history

        await self.db.flush()
        await self.db.refresh(shipment)
        logger.info(
            "Shipment %s updated via %s webhook -> %s",
            shipment.tracking_number,
            carrier_key,
            new_status.value,
        )
        return shipment

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    async def get_shipment_by_order(
        self,
        order_id: uuid.UUID,
    ) -> list[Shipment]:
        """Return all shipments associated with an order."""
        result = await self.db.execute(
            select(Shipment)
            .where(Shipment.order_id == order_id)
            .order_by(Shipment.created_at.desc())
        )
        return list(result.scalars().all())

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _get_or_404(self, shipment_id: uuid.UUID) -> Shipment:
        result = await self.db.execute(
            select(Shipment).where(Shipment.id == shipment_id)
        )
        shipment = result.scalar_one_or_none()
        if shipment is None:
            raise ValueError(f"Shipment {shipment_id} not found")
        return shipment
