"""
Order and OrderItem models.

The order tracks the full lifecycle via a status enum whose valid
transitions are enforced in the order service layer, not at the DB level.
OrderItem snapshots the product name and price at purchase time so
historical orders remain accurate even after catalog changes.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    """Order state machine states."""
    pending_payment = "pending_payment"
    processing = "processing"
    ready_for_pickup = "ready_for_pickup"
    shipped = "shipped"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"
    refunded = "refunded"


class Order(Base):
    __tablename__ = "orders"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Human-friendly order number (e.g. "BS-20260409-A1B2C3")
    order_number: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )

    # Owner -- nullable for guest checkout
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    guest_email: Mapped[str | None] = mapped_column(String(320), nullable=True)

    # Status
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status", create_constraint=True),
        default=OrderStatus.pending_payment,
        server_default="pending_payment",
        nullable=False,
    )

    # Financial totals
    subtotal_net: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_gross: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR", server_default="EUR")

    # Shipping address (snapshot at order time)
    shipping_street: Mapped[str | None] = mapped_column(String(256), nullable=True)
    shipping_city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    shipping_postal_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    shipping_province: Mapped[str | None] = mapped_column(String(128), nullable=True)
    shipping_country: Mapped[str] = mapped_column(
        String(2), default="ES", server_default="ES"
    )

    # Billing address
    billing_street: Mapped[str | None] = mapped_column(String(256), nullable=True)
    billing_city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    billing_postal_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    billing_province: Mapped[str | None] = mapped_column(String(128), nullable=True)
    billing_country: Mapped[str] = mapped_column(
        String(2), default="ES", server_default="ES"
    )

    # Payment
    payment_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    payment_intent_id: Mapped[str | None] = mapped_column(String(256), nullable=True)

    # Notes (internal or customer)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="orders", lazy="selectin"
    )
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", lazy="selectin", cascade="all, delete-orphan"
    )
    shipments: Mapped[list["Shipment"]] = relationship(  # noqa: F821
        "Shipment", back_populates="order", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Order {self.order_number} [{self.status.value}]>"


class OrderItem(Base):
    __tablename__ = "order_items"

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

    # Product reference (FK kept for analytics; name is snapshot)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    product_name: Mapped[str] = mapped_column(String(256), nullable=False)

    # Quantity & unit pricing (net, at time of purchase)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price_net: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)

    @hybrid_property
    def tax_amount(self) -> Decimal:
        """Per-unit tax amount."""
        return (self.unit_price_net * self.tax_rate / Decimal("100")).quantize(
            Decimal("0.01")
        )

    @hybrid_property
    def unit_price_gross(self) -> Decimal:
        """Per-unit gross price (net + tax)."""
        return (self.unit_price_net + self.tax_amount).quantize(Decimal("0.01"))

    # Line totals stored for fast aggregation
    line_total_net: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    line_total_gross: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")

    def __repr__(self) -> str:
        return f"<OrderItem {self.product_name} x{self.quantity}>"
