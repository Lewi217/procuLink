import math
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_dep, get_current_user, require_supplier
from app.models.user import User
from app.schemas.catalog import CatalogItemCreate, CatalogItemUpdate, CatalogItemRead
from app.schemas.admin import PaginatedResponse, PaginationMeta
from app.services import catalog_service
from app.utils.exceptions import create_success_response, APIResponse

router = APIRouter()


@router.post("", response_model=APIResponse[CatalogItemRead], status_code=status.HTTP_201_CREATED)
async def create_catalog_item(
    data: CatalogItemCreate,
    db: AsyncSession = Depends(get_db_dep),
    current_user: User = Depends(require_supplier),
):
    """Create a new catalog item. Requires SUPPLIER role."""
    item = await catalog_service.create_item(db, current_user, data)
    return create_success_response(
        message="Catalog item created successfully.", data=CatalogItemRead.model_validate(item)
    )


@router.get("", response_model=PaginatedResponse[CatalogItemRead])
async def list_catalog_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_dep),
):
    """Browse and search catalog items. Public endpoint."""
    items, total = await catalog_service.list_items(db, search, category, page, pageSize)
    total_pages = math.ceil(total / pageSize) if total > 0 else 0
    return PaginatedResponse(
        success=True,
        data=[CatalogItemRead.model_validate(i) for i in items],
        meta=PaginationMeta(page=page, pageSize=pageSize, totalItems=total, totalPages=total_pages),
    )


@router.get("/supplier/{supplier_id}", response_model=PaginatedResponse[CatalogItemRead])
async def get_supplier_catalog(
    supplier_id: uuid.UUID,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_dep),
):
    """Get a specific supplier's full catalog. Public endpoint."""
    items, total = await catalog_service.list_by_supplier(db, supplier_id, page, pageSize)
    total_pages = math.ceil(total / pageSize) if total > 0 else 0
    return PaginatedResponse(
        success=True,
        data=[CatalogItemRead.model_validate(i) for i in items],
        meta=PaginationMeta(page=page, pageSize=pageSize, totalItems=total, totalPages=total_pages),
    )


@router.get("/{item_id}", response_model=APIResponse[CatalogItemRead])
async def get_catalog_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_dep),
):
    """Get a single catalog item by ID. Public endpoint."""
    item = await catalog_service.get_item(db, item_id)
    return create_success_response(data=CatalogItemRead.model_validate(item))


@router.put("/{item_id}", response_model=APIResponse[CatalogItemRead])
async def update_catalog_item(
    item_id: uuid.UUID,
    data: CatalogItemUpdate,
    db: AsyncSession = Depends(get_db_dep),
    current_user: User = Depends(require_supplier),
):
    """Update a catalog item. Requires SUPPLIER (owner) role."""
    item = await catalog_service.update_item(db, item_id, current_user, data)
    return create_success_response(
        message="Catalog item updated successfully.", data=CatalogItemRead.model_validate(item)
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_catalog_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_dep),
    current_user: User = Depends(require_supplier),
):
    """Soft-delete a catalog item. Requires SUPPLIER (owner) role."""
    await catalog_service.delete_item(db, item_id, current_user)
    return None
