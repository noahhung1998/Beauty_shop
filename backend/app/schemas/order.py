"""
Pydantic schemas for order creation, status updates, and responses.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Nested / shared schemas
# ---------------------------------------------------------------------------

class AddressSchema(BaseModel):
    """Reusable address block."""
    street: str = Field(..., max_length=256)
    city: str = Field(..., max_length=128)
    postal_code: str = Field(..., max_length=10)
    province: str = Field(..., max_length=128)
    country: str = Field("ES", max_length=2)


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class OrderItemCreate(BaseModel):
    """Single line item in an order creation request."""
    product_id: uuid.UUID
    quantity: int = Field(..., ge=1)


class OrderCreate(BaseModel):
    """Full order creation payload."""
    items: list[OrderItemCreate] = Field(..., min_length=1)
    shipping_address: AddressSchema
    billing_address: AddressSchema | None = None
    payment_method: str = Field(
        ..., description="One of: stripe, redsys, bizum"
    )
    guest_email: EmailStr | None = Field(
        None, description="Required for guest checkout"
    )
    notes: str | None = None


class OrderStatusUpdate(BaseModel):
    """Admin payload to transition order status."""
    status: str = Field(
        ..., description="Target status from the order state machine"
    )
    notes: str | None = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID | None
    product_name: str
    quantity: int
    unit_price_net: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    unit_price_gross: Decimal
    line_total_net: Decimal
    line_total_gross: Decimal
    created_at: datetime


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_number: str
    user_id: uuid.UUID | None
    guest_email: str | None
    status: str
    subtotal_net: Decimal
    total_tax: Decimal
    total_gross: Decimal
    currency: str

    # Shipping address
    shipping_street: str | None
    shipping_city: str | None
    shipping_postal_code: str | None
    shipping_province: str | None
    shipping_country: str

    # Billing address
    billing_street: str | None
    billing_city: str | None
    billing_postal_code: str | None
    billing_province: str | None
    billing_country: str

    payment_method: str | None
    payment_intent_id: str | None
    notes: str | None

    items: list[OrderItemResponse] = []

    created_at: datetime
    updated_at: datetime
