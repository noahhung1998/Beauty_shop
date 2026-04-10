"""
Shipment model -- tracks parcel lifecycle from label creation to delivery.

``tracking_history`` is a JSON array of event objects so the full
audit trail from the carrier is preserved without extra tables.
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Carrier(str, enum.Enum):
    correos = "correos"
    seur = "seur"
    dhl = "dhl"
    other = "other"


class ShipmentStatus(str, enum.Enum):
    label_created = "label_created"
    picked_up = "picked_up"
    in_transit = "in_transit"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    returned = "returned"
    exception = "exception"


class Shipment(Base):
    __tablename__ = "shipments"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Parent order
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Carrier info
    carrier: Mapped[Carrier] = mapped_column(
        Enum(Carrier, name="carrier_enum", create_constraint=True),
        nullable=False,
    )
    tracking_number: Mapped[str | None] = mapped_column(
        String(128), unique=True, index=True, nullable=True
    )

    # Current status
    status: Mapped[ShipmentStatus] = mapped_column(
        Enum(ShipmentStatus, name="shipment_status", create_constraint=True),
        default=ShipmentStatus.label_created,
        server_default="label_created",
        nullable=False,
    )

    # Location
    current_location: Mapped[str | None] = mapped_column(String(256), nullable=True)
    current_location_detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Delivery dates
    estimated_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_delivery_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Last time we received an update from the carrier
    last_carrier_update: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Full tracking history as JSON array:
    # [{"timestamp": "...", "location": "...", "status": "...", "detail": "..."}, ...]
    tracking_history: Mapped[list | None] = mapped_column(JSON, default=list)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    order: Mapped["Order"] = relationship(  # noqa: F821
        "Order", back_populates="shipments", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Shipment {self.tracking_number} [{self.status.value}]>"
