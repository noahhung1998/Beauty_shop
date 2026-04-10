"""
Order routes -- create, list, detail, status update, cancellation.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_admin, get_current_user
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new order",
)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Order:
    """Create an order with full per-item tax calculation.

    Authenticated users have the order linked to their account.
    Guest checkout requires ``guest_email`` in the payload.
    """
    service = OrderService(db)
    user_id = current_user.id if current_user else None

    if user_id is None and not data.guest_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="guest_email is required for guest checkout",
        )

    try:
        order = await service.create_order(data, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return order


@router.get(
    "",
    response_model=list[OrderResponse],
    summary="List orders (admin: all, user: own)",
)
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
) -> list[Order]:
    """Return orders.  Admins see all orders; regular users see only their own."""
    offset = (page - 1) * page_size

    if current_user.is_admin:
        query = select(Order)
    else:
        query = select(Order).where(Order.user_id == current_user.id)

    if status_filter:
        query = query.where(Order.status == status_filter)

    query = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get order detail",
)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:
    """Return a single order.  Non-admin users can only access their own orders."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Authorization: regular users can only see their own orders
    if not current_user.is_admin and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return order


@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Update order status (admin)",
)
async def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Order:
    """Transition an order to a new status (admin only).

    The order service enforces the state machine -- invalid transitions
    are rejected with a 400 error.
    """
    service = OrderService(db)
    try:
        order = await service.update_order_status(order_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return order


@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancel an order",
)
async def cancel_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:
    """Cancel an order.  Users can cancel their own orders; admins can cancel any."""
    # Verify ownership or admin
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if not current_user.is_admin and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    service = OrderService(db)
    try:
        order = await service.cancel_order(order_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return order
