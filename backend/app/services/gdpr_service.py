"""
GDPR compliance service.

Implements the three core data-subject rights used in this application:

1. **Right of Access** (Art. 15) -- ``export_user_data``
2. **Right to Erasure** (Art. 17) -- ``anonymize_user``
3. **Consent management** -- ``record_consent`` / ``delete_consent_records``

Financial/order data is *not* deleted during anonymization because
Spanish tax law (Ley General Tributaria) requires retention for 4 years
and commercial law (Codigo de Comercio) for 6 years.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consent import ConsentRecord
from app.models.order import Order
from app.models.telemetry import UserEvent
from app.models.user import User

logger = logging.getLogger(__name__)

_ANONYMIZED = "ANONYMIZED"


class GDPRService:
    """Operations for GDPR compliance."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Right to Erasure (anonymization)
    # ------------------------------------------------------------------

    async def anonymize_user(self, user_id: uuid.UUID) -> User:
        """Replace all PII with placeholder values.

        Financial data on orders is preserved for legal compliance.
        The account is deactivated and flagged as anonymized so it
        cannot be used to log in.

        Raises:
            ValueError: If the user does not exist.
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise ValueError(f"User {user_id} not found")

        # Anonymize PII fields
        user.email = f"anonymized-{user_id}@deleted.invalid"
        user.hashed_password = _ANONYMIZED
        user.first_name = _ANONYMIZED
        user.last_name = _ANONYMIZED
        user.phone = None
        user.street = None
        user.city = None
        user.postal_code = None
        user.province = None
        user.is_active = False
        user.is_anonymized = True

        # Anonymize guest_email on orders (but keep financial data)
        await self.db.execute(
            update(Order)
            .where(Order.user_id == user_id)
            .values(guest_email=None)
        )

        # Scrub IP addresses from telemetry events
        await self.db.execute(
            update(UserEvent)
            .where(UserEvent.user_id == user_id)
            .values(ip_address=None)
        )

        await self.db.flush()
        await self.db.refresh(user)
        logger.info("User %s anonymized (GDPR erasure)", user_id)
        return user

    # ------------------------------------------------------------------
    # Right of Access (data export)
    # ------------------------------------------------------------------

    async def export_user_data(self, user_id: uuid.UUID) -> dict:
        """Compile all personal data held for a user into a JSON-serializable dict.

        Returns:
            A dictionary with keys ``user``, ``orders``, ``consent_records``,
            and ``telemetry_events``.

        Raises:
            ValueError: If the user does not exist.
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise ValueError(f"User {user_id} not found")

        # User profile
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "street": user.street,
            "city": user.city,
            "postal_code": user.postal_code,
            "province": user.province,
            "country": user.country,
            "is_active": user.is_active,
            "gdpr_consent_at": user.gdpr_consent_at.isoformat() if user.gdpr_consent_at else None,
            "gdpr_consent_ip": user.gdpr_consent_ip,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        }

        # Orders
        orders_result = await self.db.execute(
            select(Order).where(Order.user_id == user_id).order_by(Order.created_at)
        )
        orders = orders_result.scalars().all()
        orders_data = [
            {
                "order_number": o.order_number,
                "status": o.status.value,
                "total_gross": str(o.total_gross),
                "currency": o.currency,
                "created_at": o.created_at.isoformat(),
            }
            for o in orders
        ]

        # Consent records
        consents_result = await self.db.execute(
            select(ConsentRecord).where(ConsentRecord.user_id == user_id)
        )
        consents = consents_result.scalars().all()
        consents_data = [
            {
                "consent_type": c.consent_type,
                "is_granted": c.is_granted,
                "granted_at": c.granted_at.isoformat(),
                "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
            }
            for c in consents
        ]

        # Telemetry (limited to metadata, not full payloads)
        events_result = await self.db.execute(
            select(UserEvent)
            .where(UserEvent.user_id == user_id)
            .order_by(UserEvent.created_at)
            .limit(1000)
        )
        events = events_result.scalars().all()
        events_data = [
            {
                "event_type": e.event_type,
                "page_url": e.page_url,
                "ip_address": e.ip_address,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ]

        return {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user": user_data,
            "orders": orders_data,
            "consent_records": consents_data,
            "telemetry_events": events_data,
        }

    # ------------------------------------------------------------------
    # Consent management
    # ------------------------------------------------------------------

    async def record_consent(
        self,
        *,
        user_id: uuid.UUID | None,
        session_id: str | None,
        consent_type: str,
        is_granted: bool,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> ConsentRecord:
        """Create an immutable consent record.

        If a prior active consent of the same type exists and the new
        record revokes it, the old record's ``revoked_at`` is set.
        """
        # If revoking, mark the previous grant as revoked
        if not is_granted and user_id:
            prev_result = await self.db.execute(
                select(ConsentRecord).where(
                    ConsentRecord.user_id == user_id,
                    ConsentRecord.consent_type == consent_type,
                    ConsentRecord.is_granted.is_(True),
                    ConsentRecord.revoked_at.is_(None),
                )
            )
            prev = prev_result.scalar_one_or_none()
            if prev:
                prev.revoked_at = datetime.now(timezone.utc)

        record = ConsentRecord(
            user_id=user_id,
            session_id=session_id,
            consent_type=consent_type,
            is_granted=is_granted,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        logger.info(
            "Consent recorded: type=%s granted=%s user=%s",
            consent_type,
            is_granted,
            user_id,
        )
        return record

    async def delete_consent_records(self, user_id: uuid.UUID) -> int:
        """Delete all consent records for a user (used during full erasure).

        Returns the number of records deleted.
        """
        result = await self.db.execute(
            select(ConsentRecord).where(ConsentRecord.user_id == user_id)
        )
        records = result.scalars().all()
        count = len(records)
        for record in records:
            await self.db.delete(record)
        await self.db.flush()
        logger.info("Deleted %d consent records for user %s", count, user_id)
        return count
