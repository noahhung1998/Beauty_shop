"""
Beauty Shop API -- FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine

# Import routers
from app.api.v1.auth import router as auth_router
from app.api.v1.products import router as products_router
from app.api.v1.orders import router as orders_router
from app.api.v1.logistics import router as logistics_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.gdpr import router as gdpr_router

# Import payment gateway implementations so they register with the factory
import app.services.payment.stripe_gateway  # noqa: F401
import app.services.payment.redsys_gateway  # noqa: F401
import app.services.payment.bizum_gateway   # noqa: F401

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle events."""
    # Startup
    logger.info(
        "Starting %s v%s", settings.APP_NAME, settings.APP_VERSION
    )
    yield
    # Shutdown -- dispose of the connection pool cleanly
    await engine.dispose()
    logger.info("Application shut down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend API for a Spanish beauty e-commerce platform. "
        "Supports IVA tax calculation, GDPR compliance, multi-carrier "
        "logistics, and behavioral analytics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API v1 routers
# ---------------------------------------------------------------------------
API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(products_router, prefix=API_V1_PREFIX)
app.include_router(orders_router, prefix=API_V1_PREFIX)
app.include_router(logistics_router, prefix=API_V1_PREFIX)
app.include_router(telemetry_router, prefix=API_V1_PREFIX)
app.include_router(analytics_router, prefix=API_V1_PREFIX)
app.include_router(gdpr_router, prefix=API_V1_PREFIX)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Basic health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["Health"])
async def root() -> dict:
    """Root endpoint -- redirects to documentation."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "health": "/health",
    }
