import math
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User
from app.schemas.pool import PoolRead, PoolProgress
from app.services import pool_service
from app.utils.exceptions import create_success_response


def _paginated(data, total, page, page_size):
    return create_success_response(
        data=data,
        meta={
            "page": page, "pageSize": page_size,
            "totalItems": total,
            "totalPages": math.ceil(total / page_size) if page_size else 1,
        }
    )


router = APIRouter(prefix="/pools", tags=["Pools"])


@router.get("", response_model=None, status_code=status.HTTP_200_OK)
async def list_pools(
    catalog_item_id: Optional[str] = Query(None),
    supplier_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="OPEN | LOCKED | EXPIRED | FULFILLED"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List aggregation pools. Filter by catalog item, supplier, or status."""
    pools, total = await pool_service.list_pools(db, catalog_item_id, supplier_id, status, page, page_size)
    return _paginated(
        data=[PoolRead.model_validate(p) for p in pools],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{pool_id}/progress", response_model=None, status_code=status.HTTP_200_OK)
async def get_pool_progress(
    pool_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregation progress: quantity filled, threshold, % complete, and contributor count."""
    progress = await pool_service.get_progress(db, pool_id)
    return create_success_response(data=progress.model_dump())


@router.get("/{pool_id}", response_model=None, status_code=status.HTTP_200_OK)
async def get_pool(
    pool_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single pool by ID."""
    pool = await pool_service.get_pool(db, pool_id)
    return create_success_response(data=PoolRead.model_validate(pool))


@router.post("/{pool_id}/lock", response_model=None, status_code=status.HTTP_200_OK)
async def lock_pool(
    pool_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Admin-only: manually lock a pool. Also locks all POOLING RFQs inside it."""
    pool = await pool_service.lock_pool(db, pool_id, admin)
    return create_success_response(data=PoolRead.model_validate(pool))
