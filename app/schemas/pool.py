import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.pool import PoolStatus


class PoolRead(BaseModel):
    id: uuid.UUID
    catalog_item_id: uuid.UUID
    supplier_id: uuid.UUID
    total_quantity: int
    threshold_quantity: int
    status: PoolStatus
    locked_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PoolProgress(BaseModel):
    pool_id: uuid.UUID
    total_quantity: int
    threshold_quantity: int
    percent_complete: float
    contributing_manufacturer_count: int
