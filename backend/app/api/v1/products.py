"""
Product catalog routes -- public listing/detail and admin CRUD.
"""

import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_admin
from app.models.product import Product
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["Products"])


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=ProductListResponse,
    summary="List products (paginated, filterable)",
)
async def list_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    brand: str | None = Query(None),
    search: str | None = Query(None, description="Search in name and description"),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    is_active: bool = Query(True),
) -> dict:
    """Return a paginated, filterable product listing."""
    query = select(Product).where(Product.is_active == is_active)

    if category:
        query = query.where(Product.category == category)
    if brand:
        query = query.where(Product.brand == brand)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            Product.name.ilike(pattern) | Product.description.ilike(pattern)
        )
    if min_price is not None:
        query = query.where(Product.price_net >= min_price)
    if max_price is not None:
        query = query.where(Product.price_net <= max_price)

    # Total count for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch page
    offset = (page - 1) * page_size
    query = query.order_by(Product.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
    }


@router.get(
    "/{slug}",
    response_model=ProductResponse,
    summary="Get a single product by slug",
)
async def get_product(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> Product:
    """Return product detail by URL slug."""
    result = await db.execute(select(Product).where(Product.slug == slug))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product (admin)",
)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Product:
    """Create a new catalog product."""
    # Check uniqueness of SKU and slug
    existing_sku = await db.execute(
        select(Product).where(Product.sku == data.sku)
    )
    if existing_sku.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{data.sku}' already exists",
        )
    existing_slug = await db.execute(
        select(Product).where(Product.slug == data.slug)
    )
    if existing_slug.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with slug '{data.slug}' already exists",
        )

    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update a product (admin)",
)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Product:
    """Partially update an existing product."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a product (admin)",
)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    """Soft-delete a product by setting ``is_active`` to False.

    Products are never hard-deleted because existing order items
    reference them.
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.is_active = False
    await db.flush()
