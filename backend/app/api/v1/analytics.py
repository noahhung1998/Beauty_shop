"""
Analytics routes -- aggregated business intelligence endpoints.

All endpoints are admin-only. In production, consider caching
expensive aggregations in Redis or pre-computing them via Celery.
"""

import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_admin
from app.models.order import Order, OrderItem, OrderStatus
from app.models.telemetry import UserEvent
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _default_date_range(
    start: datetime | None,
    end: datetime | None,
) -> tuple[datetime, datetime]:
    """Return a (start, end) tuple with sensible defaults (last 30 days)."""
    if end is None:
        end = datetime.now(timezone.utc)
    if start is None:
        start = end - timedelta(days=30)
    return start, end


# ---------------------------------------------------------------------------
# Sales analytics
# ---------------------------------------------------------------------------

@router.get(
    "/sales",
    summary="Aggregated sales by date range",
)
async def sales_analytics(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
) -> dict:
    """Return total orders, revenue, and average order value for the period."""
    start, end = _default_date_range(start_date, end_date)

    result = await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.coalesce(func.sum(Order.total_gross), 0).label("total_revenue"),
            func.coalesce(func.avg(Order.total_gross), 0).label("avg_order_value"),
        ).where(
            Order.created_at.between(start, end),
            Order.status.notin_([
                OrderStatus.cancelled.value,
                OrderStatus.refunded.value,
            ]),
        )
    )
    row = result.one()
    return {
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "total_orders": row.total_orders,
        "total_revenue": float(row.total_revenue),
        "avg_order_value": round(float(row.avg_order_value), 2),
        "currency": "EUR",
    }


# ---------------------------------------------------------------------------
# Top products
# ---------------------------------------------------------------------------

@router.get(
    "/products/top",
    summary="Best-selling products",
)
async def top_products(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    limit: int = Query(10, ge=1, le=100),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
) -> dict:
    """Return top N products by units sold."""
    start, end = _default_date_range(start_date, end_date)

    result = await db.execute(
        select(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.line_total_gross).label("revenue"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.created_at.between(start, end),
            Order.status.notin_([
                OrderStatus.cancelled.value,
                OrderStatus.refunded.value,
            ]),
        )
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )
    rows = result.all()

    return {
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "products": [
            {
                "product_id": str(r.product_id) if r.product_id else None,
                "product_name": r.product_name,
                "units_sold": int(r.units_sold),
                "revenue": float(r.revenue),
            }
            for r in rows
        ],
    }


# ---------------------------------------------------------------------------
# Behavioral analytics: dwell time
# ---------------------------------------------------------------------------

@router.get(
    "/behavior/dwell-time",
    summary="Average dwell time by page or event type",
)
async def dwell_time_analytics(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    group_by: str = Query("event_type", description="Group by 'event_type' or 'page_url'"),
) -> dict:
    """Return average dwell time grouped by event type or page URL."""
    start, end = _default_date_range(start_date, end_date)

    if group_by == "page_url":
        group_col = UserEvent.page_url
    else:
        group_col = UserEvent.event_type

    result = await db.execute(
        select(
            group_col.label("group_key"),
            func.avg(UserEvent.dwell_time_ms).label("avg_dwell_ms"),
            func.count(UserEvent.id).label("event_count"),
        )
        .where(
            UserEvent.created_at.between(start, end),
            UserEvent.dwell_time_ms.isnot(None),
        )
        .group_by(group_col)
        .order_by(func.avg(UserEvent.dwell_time_ms).desc())
        .limit(50)
    )
    rows = result.all()

    return {
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "grouped_by": group_by,
        "data": [
            {
                "group": r.group_key,
                "avg_dwell_time_ms": round(float(r.avg_dwell_ms), 1),
                "event_count": r.event_count,
            }
            for r in rows
        ],
    }


# ---------------------------------------------------------------------------
# Behavioral analytics: cart abandonment
# ---------------------------------------------------------------------------

@router.get(
    "/behavior/cart-abandonment",
    summary="Cart abandonment rate",
)
async def cart_abandonment(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
) -> dict:
    """Calculate cart abandonment rate from telemetry events.

    Abandonment rate = 1 - (purchase_completed / add_to_cart).
    Sessions that added to cart but never completed checkout are
    considered abandoned.
    """
    start, end = _default_date_range(start_date, end_date)

    result = await db.execute(
        select(
            func.count(
                func.distinct(
                    case(
                        (UserEvent.event_type == "add_to_cart", UserEvent.session_id),
                        else_=None,
                    )
                )
            ).label("cart_sessions"),
            func.count(
                func.distinct(
                    case(
                        (UserEvent.event_type == "purchase_completed", UserEvent.session_id),
                        else_=None,
                    )
                )
            ).label("purchase_sessions"),
        ).where(UserEvent.created_at.between(start, end))
    )
    row = result.one()
    cart_sessions = row.cart_sessions or 0
    purchase_sessions = row.purchase_sessions or 0

    if cart_sessions > 0:
        abandonment_rate = round(1 - (purchase_sessions / cart_sessions), 4)
    else:
        abandonment_rate = 0.0

    return {
        "period": {"start": start.isoformat(), "end": end.isoformat()},
        "cart_sessions": cart_sessions,
        "purchase_sessions": purchase_sessions,
        "abandonment_rate": abandonment_rate,
        "abandonment_pct": round(abandonment_rate * 100, 2),
    }


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------

@router.get(
    "/export",
    summary="Export analytics data as CSV",
)
async def export_csv(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    data_type: str = Query("orders", description="'orders' or 'events'"),
) -> StreamingResponse:
    """Export orders or telemetry events as a downloadable CSV file."""
    start, end = _default_date_range(start_date, end_date)
    output = io.StringIO()
    writer = csv.writer(output)

    if data_type == "orders":
        writer.writerow([
            "order_number", "status", "subtotal_net", "total_tax",
            "total_gross", "currency", "payment_method", "created_at",
        ])
        result = await db.execute(
            select(Order)
            .where(Order.created_at.between(start, end))
            .order_by(Order.created_at)
        )
        for order in result.scalars().all():
            writer.writerow([
                order.order_number,
                order.status.value,
                str(order.subtotal_net),
                str(order.total_tax),
                str(order.total_gross),
                order.currency,
                order.payment_method,
                order.created_at.isoformat(),
            ])
    elif data_type == "events":
        writer.writerow([
            "id", "session_id", "event_type", "page_url",
            "dwell_time_ms", "device_type", "created_at",
        ])
        result = await db.execute(
            select(UserEvent)
            .where(UserEvent.created_at.between(start, end))
            .order_by(UserEvent.created_at)
            .limit(50000)  # Safety limit
        )
        for event in result.scalars().all():
            writer.writerow([
                event.id,
                event.session_id,
                event.event_type,
                event.page_url,
                event.dwell_time_ms,
                event.device_type,
                event.created_at.isoformat(),
            ])
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="data_type must be 'orders' or 'events'",
        )

    output.seek(0)
    filename = f"beauty_shop_{data_type}_{start.strftime('%Y%m%d')}_{end.strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
