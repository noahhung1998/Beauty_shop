"""
Pydantic schemas for user authentication and profile endpoints.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    """Payload for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=128)
    last_name: str = Field(..., min_length=1, max_length=128)
    phone: str | None = Field(None, max_length=20)
    street: str | None = Field(None, max_length=256)
    city: str | None = Field(None, max_length=128)
    postal_code: str | None = Field(None, max_length=10)
    province: str | None = Field(None, max_length=128)
    country: str = Field("ES", max_length=2)
    gdpr_consent: bool = Field(
        ..., description="User must explicitly grant GDPR consent to register"
    )


class UserLogin(BaseModel):
    """Payload for login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Partial update of user profile."""
    first_name: str | None = Field(None, max_length=128)
    last_name: str | None = Field(None, max_length=128)
    phone: str | None = Field(None, max_length=20)
    street: str | None = Field(None, max_length=256)
    city: str | None = Field(None, max_length=128)
    postal_code: str | None = Field(None, max_length=10)
    province: str | None = Field(None, max_length=128)
    country: str | None = Field(None, max_length=2)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """Public representation of a user."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    phone: str | None = None
    street: str | None = None
    city: str | None = None
    postal_code: str | None = None
    province: str | None = None
    country: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token lifetime in seconds")
