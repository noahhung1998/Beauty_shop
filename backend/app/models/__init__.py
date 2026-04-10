"""
ORM models package.

Importing everything here so Alembic auto-generation can discover
all models through ``Base.metadata``.
"""

from app.models.user import User  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.order import Order, OrderItem  # noqa: F401
from app.models.shipment import Shipment  # noqa: F401
from app.models.telemetry import UserEvent  # noqa: F401
from app.models.consent import ConsentRecord  # noqa: F401
