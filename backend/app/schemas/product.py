"""
Pydantic schemas for product CRUD and listing endpoints.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ProductCreate(BaseModel):
    """Payload for creating a product (admin)."""
    sku: str = Field(..., max_length=64)
    name: str = Field(..., max_length=256)
    slug: str = Field(..., max_length=280)
    description: str | None = None
    description_short: str | None = Field(None, max_length=512)
    price_net: Decimal = Field(..., ge=0, decimal_places=2)
    tax_rate: Decimal = Field(Decimal("21.00"), ge=0, le=100, decimal_places=2)
    currency: str = Field("EUR", max_length=3)
    stock_quantity: int = Field(0, ge=0)
    category: str | None = Field(None, max_length=128)
    brand: str | None = Field(None, max_length=128)
    image_urls: list[str] | None = None
    is_active: bool = True
    weight_grams: int | None = Field(None, ge=0)


class ProductUpdate(BaseModel):
    """Partial update -- all fields optional."""
    name: str | None = Field(None, max_length=256)
    slug: str | None = Field(None, max_length=280)
    description: str | None = None
    description_short: str | None = Field(None, max_length=512)
    price_net: Decimal | None = Field(None, ge=0, decimal_places=2)
    tax_rate: Decimal | None = Field(None, ge=0, le=100, decimal_places=2)
    currency: str | None = Field(None, max_length=3)
    stock_quantity: int | None = Field(None, ge=0)
    category: str | None = Field(None, max_length=128)
    brand: str | None = Field(None, max_length=128)
    image_urls: list[str] | None = None
    is_active: bool | None = None
    weight_grams: int | None = Field(None, ge=0)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ProductResponse(BaseModel):
    """Single product response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sku: str
    name: str
    slug: str
    description: str | None = None
    description_short: str | None = None
    price_net: Decimal
    tax_rate: Decimal
    price_gross: Decimal
    currency: str
    stock_quantity: int
    category: str | None = None
    brand: str | None = None
    image_urls: list[str] | None = None
    is_active: bool
    weight_grams: int | None = None
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    """Paginated product list."""
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int
