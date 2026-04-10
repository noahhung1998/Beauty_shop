"""
Authentication routes -- registration, login, profile management.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Create a new user account.

    GDPR consent is required and recorded with the client IP.
    """
    if not data.gdpr_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GDPR consent is required to create an account",
        )

    # Check for duplicate email
    existing = await db.execute(
        select(User).where(User.email == data.email.lower())
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    client_ip = request.client.host if request.client else None

    user = User(
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        street=data.street,
        city=data.city,
        postal_code=data.postal_code,
        province=data.province,
        country=data.country,
        gdpr_consent_at=datetime.now(timezone.utc),
        gdpr_consent_ip=client_ip,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive a JWT token",
)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Validate credentials and return a JWT access token."""
    result = await db.execute(
        select(User).where(User.email == data.email.lower())
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token = create_access_token(user.id, is_admin=user.is_admin)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the profile of the currently authenticated user."""
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Partially update the authenticated user's profile."""
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(current_user, field, value)

    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out (client-side token discard)",
)
async def logout(
    _current_user: User = Depends(get_current_user),
) -> None:
    """Logout endpoint.

    With stateless JWT, the server does not invalidate the token.
    The client must discard it.  For production, consider maintaining
    a token blocklist in Redis.
    """
    return None
