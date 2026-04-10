"""
Order service -- business logic for order creation, status transitions,
and cancellation.

The state machine defines which status transitions are legal.  Any
attempt to perform an invalid transition is rejected.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.utils.tax import calculate_tax

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Order state machine -- maps each status to the set of valid *next* states.
# ---------------------------------------------------------------------------
VALID_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.pending_payment: {
        OrderStatus.processing,
        OrderStatus.cancelled,
    },
    OrderStatus.processing: {
        OrderStatus.ready_for_pickup,
        OrderStatus.shipped,
        OrderStatus.cancelled,
    },
    OrderStatus.ready_for_pickup: {
        OrderStatus.shipped,
        OrderStatus.cancelled,
    },
    OrderStatus.shipped: {
        OrderStatus.in_transit,
        OrderStatus.cancelled,
    },
    OrderStatus.in_transit: {
        OrderStatus.delivered,
        OrderStatus.cancelled,
    },
    OrderStatus.delivered: {
        OrderStatus.refunded,
    },
    OrderStatus.cancelled: {
        OrderStatus.refunded,
    },
    OrderStatus.refunded: set(),  # terminal state
}


def _generate_order_number() -> str:
    """Generate a human-friendly order number.

    Format: ``BS-YYYYMMDD-XXXXXX`` where X is a random hex suffix.
    """
    now = datetime.now(timezone.utc)
    suffix = uuid.uuid4().hex[:6].upper()
    return f"BS-{now.strftime('%Y%m%d')}-{suffix}"


class OrderService:
    """Encapsulates order-related business rules."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_order(
        self,
        data: OrderCreate,
        user_id: uuid.UUID | None = None,
    ) -> Order:
        """Create an order with full per-item tax calculation.

        1. Look up each product to get current price and tax rate.
        2. Calculate line-level tax and gross totals.
        3. Sum into order-level totals.
        4. Persist order + items in a single transaction.

        Raises:
            ValueError: If a product is not found or has insufficient stock.
        """
        order_items: list[OrderItem] = []
        subtotal_net = Decimal("0.00")
        total_tax = Decimal("0.00")

        for item_data in data.items:
            # Fetch the product
            result = await self.db.execute(
                select(Product).where(Product.id == item_data.product_id)
            )
            product = result.scalar_one_or_none()
            if product is None:
                raise ValueError(
                    f"Product {item_data.product_id} not found"
                )
            if not product.is_active:
                raise ValueError(
                    f"Product '{product.name}' is not available"
                )
            if product.stock_quantity < item_data.quantity:
                raise ValueError(
                    f"Insufficient stock for '{product.name}': "
                    f"requested {item_data.quantity}, available {product.stock_quantity}"
                )

            # Tax calculation
            unit_tax, unit_gross = calculate_tax(product.price_net, product.tax_rate)
            line_net = (product.price_net * item_data.quantity).quantize(Decimal("0.01"))
            line_tax = (unit_tax * item_data.quantity).quantize(Decimal("0.01"))
            line_gross = (unit_gross * item_data.quantity).quantize(Decimal("0.01"))

            order_item = OrderItem(
                product_id=product.id,
                product_name=product.name,
                quantity=item_data.quantity,
                unit_price_net=product.price_net,
                tax_rate=product.tax_rate,
                line_total_net=line_net,
                line_total_gross=line_gross,
            )
            order_items.append(order_item)

            subtotal_net += line_net
            total_tax += line_tax

            # Decrement stock
            product.stock_quantity -= item_data.quantity

        total_gross = subtotal_net + total_tax

        # Build the order
        billing = data.billing_address or data.shipping_address
        order = Order(
            order_number=_generate_order_number(),
            user_id=user_id,
            guest_email=data.guest_email if user_id is None else None,
            status=OrderStatus.pending_payment,
            subtotal_net=subtotal_net,
            total_tax=total_tax,
            total_gross=total_gross,
            payment_method=data.payment_method,
            notes=data.notes,
            # Shipping
            shipping_street=data.shipping_address.street,
            shipping_city=data.shipping_address.city,
            shipping_postal_code=data.shipping_address.postal_code,
            shipping_province=data.shipping_address.province,
            shipping_country=data.shipping_address.country,
            # Billing
            billing_street=billing.street,
            billing_city=billing.city,
            billing_postal_code=billing.postal_code,
            billing_province=billing.province,
            billing_country=billing.country,
        )
        order.items = order_items

        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        logger.info("Order %s created (total_gross=%s)", order.order_number, total_gross)
        return order

    # ------------------------------------------------------------------
    # Status transitions
    # ------------------------------------------------------------------

    async def update_order_status(
        self,
        order_id: uuid.UUID,
        update: OrderStatusUpdate,
    ) -> Order:
        """Transition an order to a new status if the transition is valid.

        Raises:
            ValueError: If the order is not found or the transition is illegal.
        """
        order = await self._get_or_404(order_id)
        try:
            new_status = OrderStatus(update.status)
        except ValueError:
            raise ValueError(
                f"Invalid status '{update.status}'. "
                f"Valid values: {[s.value for s in OrderStatus]}"
            )

        allowed = VALID_TRANSITIONS.get(order.status, set())
        if new_status not in allowed:
            raise ValueError(
                f"Cannot transition from '{order.status.value}' to '{new_status.value}'. "
                f"Allowed transitions: {[s.value for s in allowed]}"
            )

        old_status = order.status
        order.status = new_status
        if update.notes:
            order.notes = (order.notes or "") + f"\n[{new_status.value}] {update.notes}"

        await self.db.flush()
        await self.db.refresh(order)
        logger.info(
            "Order %s transitioned %s -> %s",
            order.order_number,
            old_status.value,
            new_status.value,
        )
        return order

    # ------------------------------------------------------------------
    # Cancel
    # ------------------------------------------------------------------

    async def cancel_order(self, order_id: uuid.UUID) -> Order:
        """Cancel an order. Restores product stock."""
        order = await self._get_or_404(order_id)

        allowed = VALID_TRANSITIONS.get(order.status, set())
        if OrderStatus.cancelled not in allowed:
            raise ValueError(
                f"Cannot cancel order in status '{order.status.value}'"
            )

        # Restore stock for each item
        for item in order.items:
            if item.product_id:
                result = await self.db.execute(
                    select(Product).where(Product.id == item.product_id)
                )
                product = result.scalar_one_or_none()
                if product:
                    product.stock_quantity += item.quantity

        order.status = OrderStatus.cancelled
        await self.db.flush()
        await self.db.refresh(order)
        logger.info("Order %s cancelled", order.order_number)
        return order

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    async def get_order_by_id(self, order_id: uuid.UUID) -> Order | None:
        """Fetch a single order by primary key."""
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_orders_for_user(
        self,
        user_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> list[Order]:
        """Return paginated orders belonging to a user."""
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all())

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _get_or_404(self, order_id: uuid.UUID) -> Order:
        order = await self.get_order_by_id(order_id)
        if order is None:
            raise ValueError(f"Order {order_id} not found")
        return order
