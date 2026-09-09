import uuid
import math
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.pool import Pool, PoolStatus
from app.repositories import pool_repository
from app.schemas.pool import PoolProgress
from app.utils.exceptions import NotFoundError, ForbiddenError, BaseAppException


class PoolAlreadyLockedError(BaseAppException):
    def __init__(self):
        super().__init__(status_code=409, code="POOL_ALREADY_LOCKED", message="Pool is already locked.")


async def get_pool(db: AsyncSession, pool_id: str) -> Pool:
    pool = await pool_repository.get_by_id(db, pool_id)
    if not pool:
        raise NotFoundError("Pool not found.")
    return pool


async def list_pools(
    db: AsyncSession,
    catalog_item_id: Optional[str],
    supplier_id: Optional[str],
    status: Optional[str],
    page: int,
    page_size: int,
) -> tuple[list[Pool], int]:
    return await pool_repository.get_list(
        db,
        catalog_item_id=uuid.UUID(catalog_item_id) if catalog_item_id else None,
        supplier_id=uuid.UUID(supplier_id) if supplier_id else None,
        status=status,
        page=page,
        page_size=page_size,
    )


async def get_progress(db: AsyncSession, pool_id: str) -> PoolProgress:
    pool = await get_pool(db, pool_id)
    count = await pool_repository.get_contributing_count(db, pool.id)
    pct = min(100.0, round((pool.total_quantity / pool.threshold_quantity) * 100, 1)) if pool.threshold_quantity else 0.0
    return PoolProgress(
        pool_id=pool.id,
        total_quantity=pool.total_quantity,
        threshold_quantity=pool.threshold_quantity,
        percent_complete=pct,
        contributing_manufacturer_count=count,
    )


async def lock_pool(db: AsyncSession, pool_id: str, admin: User) -> Pool:
    pool = await get_pool(db, pool_id)
    if pool.status == PoolStatus.LOCKED:
        raise PoolAlreadyLockedError()

    pool = await pool_repository.lock(db, pool)

    # Lock all POOLING RFQs in this pool
    from app.repositories import rfq_repository
    await rfq_repository.lock_all_in_pool(db, pool.id)

    await db.commit()
    await db.refresh(pool)
    return pool
