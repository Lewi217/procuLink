import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import CatalogCategory, CatalogUnit


class CatalogItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: CatalogCategory
    unit: CatalogUnit
    retail_price_per_unit: Decimal = Field(..., gt=0)
    bulk_price_per_unit: Decimal = Field(..., gt=0)
    bulk_threshold_quantity: int = Field(..., gt=0)
    stock_quantity: int = Field(0, ge=0)


class CatalogItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    category: Optional[CatalogCategory] = None
    unit: Optional[CatalogUnit] = None
    retail_price_per_unit: Optional[Decimal] = Field(None, gt=0)
    bulk_price_per_unit: Optional[Decimal] = Field(None, gt=0)
    bulk_threshold_quantity: Optional[int] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)


class CatalogItemRead(BaseModel):
    id: uuid.UUID
    supplier_id: uuid.UUID
    name: str
    category: CatalogCategory
    unit: CatalogUnit
    retail_price_per_unit: Decimal
    bulk_price_per_unit: Decimal
    bulk_threshold_quantity: int
    stock_quantity: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
