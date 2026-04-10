"""
Telemetry / behavioral analytics event model.

Designed for high-frequency writes.  In production, consider:
- TimescaleDB hypertable on ``created_at``
- PostgreSQL native range partitioning by month on ``created_at``
- Write buffering via Redis + Celery bulk insert

The ``__table_args__`` comment below documents the intended partition
scheme; actual DDL is managed through Alembic or manual migration.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserEvent(Base):
    __tablename__ = "user_events"
    __table_args__ = (
        # Intended partitioning strategy (apply via raw DDL / Alembic):
        # PARTITION BY RANGE (created_at)
        {"comment": "Partitioned by month on created_at for high-frequency event ingestion"},
    )

    # Auto-incrementing BigInteger PK for write throughput
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Session tracking (anonymous or authenticated)
    session_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)

    # Optional FK to users -- null for anonymous visitors
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Event classification
    event_type: Mapped[str] = mapped_column(
        String(64), index=True, nullable=False
    )
    # Valid values: page_view, item_clicked, add_to_cart,
    #               checkout_started, purchase_completed, ...

    # Arbitrary event payload
    event_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Page context
    page_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    referrer_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # Engagement metrics
    dwell_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Client metadata
    device_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # Timestamp -- indexed for partition pruning and range queries
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<UserEvent {self.event_type} session={self.session_id}>"
