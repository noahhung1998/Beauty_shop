"""
GDPR consent record model.

Every consent grant or revocation is stored as an immutable audit row.
``revoked_at`` being non-null indicates the consent was later withdrawn.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Owner (nullable -- consent can be tracked for anonymous sessions too)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Consent details
    consent_type: Mapped[str] = mapped_column(
        String(32), nullable=False
    )
    # Valid values: "analytics", "marketing", "necessary"

    is_granted: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Audit fields required by GDPR
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Timestamps
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="consent_records", lazy="selectin"
    )

    def __repr__(self) -> str:
        status = "granted" if self.is_granted else "revoked"
        return f"<ConsentRecord {self.consent_type} {status}>"
