import uuid
import math
from typing import Optional

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import CatalogItem, CatalogCategory


async def create(db: AsyncSession, supplier_id: uuid.UUID, data: dict) -> CatalogItem:
    item = CatalogItem(supplier_id=supplier_id, **data)
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def get_by_id(db: AsyncSession, item_id: uuid.UUID | str) -> CatalogItem | None:
    stmt = select(CatalogItem).where(CatalogItem.id == item_id, CatalogItem.is_active == True)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_list(
    db: AsyncSession,
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[CatalogItem], int]:
    stmt = select(CatalogItem).where(CatalogItem.is_active == True)

    if search:
        stmt = stmt.where(CatalogItem.name.ilike(f"%{search}%"))
    if category:
        stmt = stmt.where(CatalogItem.category == category)

    # Total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # Paginated results
    stmt = stmt.order_by(CatalogItem.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = (await db.execute(stmt)).scalars().all()

    return list(items), total


async def get_by_supplier(
    db: AsyncSession,
    supplier_id: uuid.UUID | str,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[CatalogItem], int]:
    stmt = select(CatalogItem).where(
        CatalogItem.supplier_id == supplier_id,
        CatalogItem.is_active == True,
    )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(CatalogItem.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = (await db.execute(stmt)).scalars().all()

    return list(items), total


async def update(db: AsyncSession, item: CatalogItem, data: dict) -> CatalogItem:
    for field, value in data.items():
        if value is not None:
            setattr(item, field, value)
    await db.flush()
    await db.refresh(item)
    return item


async def soft_delete(db: AsyncSession, item: CatalogItem) -> None:
    item.is_active = False
    await db.flush()
