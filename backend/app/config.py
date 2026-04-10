"""
Application configuration via environment variables.

Uses pydantic-settings to parse and validate all configuration from
environment variables or a .env file. Secrets should NEVER be committed
to version control -- use environment variables or a secrets manager.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object loaded once and cached."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ---- Application --------------------------------------------------------
    APP_NAME: str = "Beauty Shop API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # ---- Database -----------------------------------------------------------
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/beauty_shop"
    # Synchronous URL used by Alembic migrations
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/beauty_shop"
    DB_ECHO: bool = False

    # ---- Authentication / JWT -----------------------------------------------
    SECRET_KEY: str = "CHANGE-ME-in-production-use-openssl-rand-hex-64"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ---- Stripe -------------------------------------------------------------
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # ---- Redsys (Spanish card gateway) --------------------------------------
    REDSYS_MERCHANT_CODE: str = ""
    REDSYS_SECRET_KEY: str = ""
    REDSYS_TERMINAL: str = "1"
    REDSYS_ENVIRONMENT: str = "test"  # "test" | "production"

    # ---- Redis / Celery -----------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ---- CORS / Security ----------------------------------------------------
    CORS_ALLOW_CREDENTIALS: bool = True

    # ---- Carrier API keys ---------------------------------------------------
    CORREOS_API_KEY: str = ""
    SEUR_API_KEY: str = ""
    DHL_API_KEY: str = ""


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()
