import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rfq import RFQ, RFQStatus


async def get_by_id(db: AsyncSession, rfq_id: uuid.UUID | str) -> RFQ | None:
    stmt = select(RFQ).where(RFQ.id == rfq_id)
    return (await db.execute(stmt)).scalars().first()


async def get_by_client_id(db: AsyncSession, client_generated_id: uuid.UUID) -> RFQ | None:
    stmt = select(RFQ).where(RFQ.client_generated_id == client_generated_id)
    return (await db.execute(stmt)).scalars().first()


async def create(db: AsyncSession, data: dict) -> RFQ:
    rfq = RFQ(**data)
    db.add(rfq)
    await db.flush()
    await db.refresh(rfq)
    return rfq


async def get_mine(
    db: AsyncSession,
    manufacturer_id: uuid.UUID,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[RFQ], int]:
    stmt = select(RFQ).where(RFQ.manufacturer_id == manufacturer_id)
    if status:
        stmt = stmt.where(RFQ.status == status)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(RFQ.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rfqs = (await db.execute(stmt)).scalars().all()
    return list(rfqs), total


async def update(db: AsyncSession, rfq: RFQ, data: dict) -> RFQ:
    for field, value in data.items():
        setattr(rfq, field, value)
    await db.flush()
    await db.refresh(rfq)
    return rfq


async def lock_all_in_pool(db: AsyncSession, pool_id: uuid.UUID) -> None:
    """Set all active RFQs in a pool to LOCKED status."""
    from sqlalchemy import update as sql_update
    stmt = (
        sql_update(RFQ)
        .where(RFQ.pool_id == pool_id, RFQ.status == RFQStatus.POOLING)
        .values(status=RFQStatus.LOCKED)
    )
    await db.execute(stmt)
