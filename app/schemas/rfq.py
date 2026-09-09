import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.rfq import InputChannel, RFQStatus


class RFQParseRequest(BaseModel):
    raw_text: str = Field(..., min_length=3, alias="rawText")
    input_channel: InputChannel = Field(InputChannel.APP_TEXT, alias="inputChannel")

    model_config = ConfigDict(populate_by_name=True)


class ParsedItem(BaseModel):
    material: str
    matched_catalog_item_id: Optional[uuid.UUID] = None
    matched_catalog_item_name: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    notes: Optional[str] = None


class AlternativeMatch(BaseModel):
    catalog_item_id: uuid.UUID
    catalog_item_name: str
    confidence: float


class RFQParseResponse(BaseModel):
    parsed: ParsedItem
    parse_confidence: float
    alternative_matches: List[AlternativeMatch] = []


class RFQCreate(BaseModel):
    raw_text: str = Field(..., alias="rawText")
    input_channel: InputChannel = Field(InputChannel.APP_TEXT, alias="inputChannel")
    matched_catalog_item_id: uuid.UUID = Field(..., alias="matchedCatalogItemId")
    quantity: int = Field(..., gt=0)
    unit: str
    notes: Optional[str] = None
    client_generated_id: Optional[uuid.UUID] = Field(None, alias="clientGeneratedId")

    model_config = ConfigDict(populate_by_name=True)


class RFQUpdate(BaseModel):
    matched_catalog_item_id: Optional[uuid.UUID] = None
    quantity: Optional[int] = Field(None, gt=0)
    unit: Optional[str] = None
    notes: Optional[str] = None


class RFQRead(BaseModel):
    id: uuid.UUID
    manufacturer_id: uuid.UUID
    catalog_item_id: Optional[uuid.UUID]
    pool_id: Optional[uuid.UUID]
    raw_text: str
    input_channel: InputChannel
    parsed_material: Optional[str]
    parsed_quantity: Optional[int]
    parsed_unit: Optional[str]
    parsed_notes: Optional[str]
    parse_confidence: Optional[float]
    status: RFQStatus
    client_generated_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
