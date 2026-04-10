"""
Product model -- catalog item with Spanish IVA tax rate support.

``price_gross`` is a hybrid property computed from ``price_net`` and
``tax_rate`` so it stays consistent whether read from Python or SQL.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Identification
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), unique=True, index=True, nullable=False)

    # Descriptions
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_short: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Pricing -- all amounts stored as net (excl. tax)
    price_net: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    tax_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("21.00"), server_default="21.00"
    )
    currency: Mapped[str] = mapped_column(String(3), default="EUR", server_default="EUR")

    @hybrid_property
    def price_gross(self) -> Decimal:
        """Net price + IVA tax."""
        return (self.price_net * (1 + self.tax_rate / Decimal("100"))).quantize(
            Decimal("0.01")
        )

    # Inventory
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    # Categorisation
    category: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    brand: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)

    # Media -- stored as a JSON array of URL strings
    image_urls: Mapped[list | None] = mapped_column(JSON, nullable=True, default=list)

    # Flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # Physical attributes (needed for shipping cost calculation)
    weight_grams: Mapped[int | None] = mapped_column(Integer, nullable=True)

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

    def __repr__(self) -> str:
        return f"<Product {self.sku} - {self.name}>"
