import uuid
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_dep, require_admin
from app.models.user import User
from app.repositories import user_repository
from app.schemas.user import UserRead
from app.schemas.admin import PaginatedResponse, PaginationMeta, UserStatusUpdate
from app.utils.exceptions import NotFoundError

router = APIRouter()

@router.get("/users", response_model=PaginatedResponse[UserRead])
async def list_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_dep),
    current_admin: User = Depends(require_admin),
):
    users, total_items = await user_repository.get_users_list(
        db=db, role=role, status=status, page=page, page_size=pageSize
    )
    
    total_pages = math.ceil(total_items / pageSize) if total_items > 0 else 0
    
    return PaginatedResponse(
        success=True,
        data=users,
        meta=PaginationMeta(
            page=page,
            pageSize=pageSize,
            totalItems=total_items,
            totalPages=total_pages
        )
    )


@router.get("/users/{user_id}", response_model=dict)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_dep),
    current_admin: User = Depends(require_admin),
):
    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise NotFoundError(message="User not found")
        
    return {
        "success": True,
        "data": UserRead.model_validate(user),
        "meta": {},
        "error": None
    }


@router.put("/users/{user_id}/status", response_model=dict)
async def update_user_status(
    user_id: uuid.UUID,
    status_update: UserStatusUpdate,
    db: AsyncSession = Depends(get_db_dep),
    current_admin: User = Depends(require_admin),
):
    user = await user_repository.update_status(db, user_id, status_update.status)
    if not user:
        raise NotFoundError(message="User not found")
        
    return {
        "success": True,
        "data": UserRead.model_validate(user),
        "meta": {},
        "error": None
    }
