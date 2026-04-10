"""
User model -- authentication, profile and GDPR-related fields.

Addresses are stored inline for simplicity; a separate Address table
can be introduced when users need multiple saved addresses.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Authentication
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)

    # Profile
    first_name: Mapped[str] = mapped_column(String(128), nullable=False)
    last_name: Mapped[str] = mapped_column(String(128), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Address (default shipping address)
    street: Mapped[str | None] = mapped_column(String(256), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    province: Mapped[str | None] = mapped_column(String(128), nullable=True)
    country: Mapped[str] = mapped_column(String(2), default="ES", server_default="ES")

    # Status flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # GDPR
    is_anonymized: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    gdpr_consent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    gdpr_consent_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)

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
    orders: Mapped[list["Order"]] = relationship(  # noqa: F821
        "Order", back_populates="user", lazy="selectin"
    )
    consent_records: Mapped[list["ConsentRecord"]] = relationship(  # noqa: F821
        "ConsentRecord", back_populates="user", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
