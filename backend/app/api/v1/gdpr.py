"""
GDPR compliance routes -- data export, account deletion, consent management.

These endpoints implement core GDPR data-subject rights required for
operating an e-commerce platform in the European Union.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.consent import ConsentRecord
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.gdpr_service import GDPRService

router = APIRouter(prefix="/gdpr", tags=["GDPR"])


# ---------------------------------------------------------------------------
# Data export (Right of Access -- Art. 15 GDPR)
# ---------------------------------------------------------------------------

@router.post(
    "/export-my-data",
    summary="Export all personal data (Art. 15 GDPR)",
)
async def export_my_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return a JSON object containing all personal data held for the user.

    This fulfills the GDPR Right of Access.  The response can be
    downloaded by the frontend as a JSON file.
    """
    service = GDPRService(db)
    try:
        data = await service.export_user_data(current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return data


# ---------------------------------------------------------------------------
# Account deletion (Right to Erasure -- Art. 17 GDPR)
# ---------------------------------------------------------------------------

@router.post(
    "/delete-my-account",
    response_model=UserResponse,
    summary="Anonymize account (Art. 17 GDPR)",
)
async def delete_my_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Anonymize the current user's personal data.

    PII is replaced with placeholder values.  Financial records are
    retained as required by Spanish tax and commercial law.  The
    account is deactivated and cannot be used to log in afterwards.
    """
    service = GDPRService(db)
    try:
        user = await service.anonymize_user(current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    return user


# ---------------------------------------------------------------------------
# Consent management
# ---------------------------------------------------------------------------

@router.get(
    "/consents",
    summary="Get current user's consent records",
)
async def get_consents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    """Return all consent records for the authenticated user."""
    result = await db.execute(
        select(ConsentRecord)
        .where(ConsentRecord.user_id == current_user.id)
        .order_by(ConsentRecord.granted_at.desc())
    )
    records = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "consent_type": r.consent_type,
            "is_granted": r.is_granted,
            "granted_at": r.granted_at.isoformat(),
            "revoked_at": r.revoked_at.isoformat() if r.revoked_at else None,
        }
        for r in records
    ]


@router.post(
    "/consents",
    status_code=status.HTTP_201_CREATED,
    summary="Record a consent decision",
)
async def record_consent(
    request: Request,
    consent_type: str,
    is_granted: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Record a consent grant or revocation.

    Valid consent types: ``analytics``, ``marketing``, ``necessary``.
    """
    valid_types = {"analytics", "marketing", "necessary"}
    if consent_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid consent_type. Must be one of: {', '.join(valid_types)}",
        )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = GDPRService(db)
    record = await service.record_consent(
        user_id=current_user.id,
        session_id=None,
        consent_type=consent_type,
        is_granted=is_granted,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return {
        "id": str(record.id),
        "consent_type": record.consent_type,
        "is_granted": record.is_granted,
        "granted_at": record.granted_at.isoformat(),
    }
