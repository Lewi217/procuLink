from typing import List, Generic, TypeVar, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginationMeta(BaseModel):
    page: int
    pageSize: int
    totalItems: int
    totalPages: int

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    meta: PaginationMeta
    error: Optional[dict] = None

class UserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|SUSPENDED)$")
