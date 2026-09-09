import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pool import Pool, PoolStatus
from app.models.rfq import RFQ


async def get_open_for_item(db: AsyncSession, catalog_item_id: uuid.UUID) -> Pool | None:
    stmt = select(Pool).where(
        Pool.catalog_item_id == catalog_item_id,
        Pool.status == PoolStatus.OPEN
    )
    return (await db.execute(stmt)).scalars().first()


async def create(
    db: AsyncSession,
    catalog_item_id: uuid.UUID,
    supplier_id: uuid.UUID,
    threshold_quantity: int,
) -> Pool:
    pool = Pool(
        catalog_item_id=catalog_item_id,
        supplier_id=supplier_id,
        threshold_quantity=threshold_quantity,
        total_quantity=0,
        status=PoolStatus.OPEN,
    )
    db.add(pool)
    await db.flush()
    await db.refresh(pool)
    return pool


async def add_quantity(db: AsyncSession, pool: Pool, qty: int) -> Pool:
    pool.total_quantity += qty
    await db.flush()
    await db.refresh(pool)
    return pool


async def lock(db: AsyncSession, pool: Pool) -> Pool:
    from datetime import datetime, timezone
    pool.status = PoolStatus.LOCKED
    pool.locked_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(pool)
    return pool


async def get_by_id(db: AsyncSession, pool_id: uuid.UUID | str) -> Pool | None:
    stmt = select(Pool).where(Pool.id == pool_id)
    return (await db.execute(stmt)).scalars().first()


async def get_list(
    db: AsyncSession,
    catalog_item_id: Optional[uuid.UUID] = None,
    supplier_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Pool], int]:
    stmt = select(Pool)
    if catalog_item_id:
        stmt = stmt.where(Pool.catalog_item_id == catalog_item_id)
    if supplier_id:
        stmt = stmt.where(Pool.supplier_id == supplier_id)
    if status:
        stmt = stmt.where(Pool.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(Pool.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    pools = (await db.execute(stmt)).scalars().all()
    return list(pools), total


async def get_contributing_count(db: AsyncSession, pool_id: uuid.UUID) -> int:
    stmt = select(func.count(func.distinct(RFQ.manufacturer_id))).where(
        RFQ.pool_id == pool_id,
        RFQ.status.notin_(["CANCELLED"])
    )
    return (await db.execute(stmt)).scalar() or 0
