import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import CatalogItem
from app.models.user import User
from app.repositories import catalog_repository
from app.schemas.catalog import CatalogItemCreate, CatalogItemUpdate
from app.utils.exceptions import NotFoundError, ForbiddenError


async def create_item(db: AsyncSession, supplier: User, data: CatalogItemCreate) -> CatalogItem:
    return await catalog_repository.create(db, supplier.id, data.model_dump())


async def get_item(db: AsyncSession, item_id: uuid.UUID) -> CatalogItem:
    item = await catalog_repository.get_by_id(db, item_id)
    if not item:
        raise NotFoundError(message="Catalog item not found.")
    return item


async def list_items(
    db: AsyncSession,
    search: Optional[str],
    category: Optional[str],
    page: int,
    page_size: int,
) -> tuple[list[CatalogItem], int]:
    return await catalog_repository.get_list(db, search, category, page, page_size)


async def list_by_supplier(
    db: AsyncSession,
    supplier_id: uuid.UUID,
    page: int,
    page_size: int,
) -> tuple[list[CatalogItem], int]:
    return await catalog_repository.get_by_supplier(db, supplier_id, page, page_size)


async def update_item(
    db: AsyncSession, item_id: uuid.UUID, current_user: User, data: CatalogItemUpdate
) -> CatalogItem:
    item = await get_item(db, item_id)
    _assert_owner(item, current_user)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    return await catalog_repository.update(db, item, update_data)


async def delete_item(db: AsyncSession, item_id: uuid.UUID, current_user: User) -> None:
    item = await get_item(db, item_id)
    _assert_owner(item, current_user)
    await catalog_repository.soft_delete(db, item)


def _assert_owner(item: CatalogItem, current_user: User) -> None:
    from app.models.user import UserRole
    # Admins can manage any item; suppliers can only manage their own
    if current_user.role == UserRole.ADMIN:
        return
    if item.supplier_id != current_user.id:
        raise ForbiddenError(message="You can only modify your own catalog items.")
