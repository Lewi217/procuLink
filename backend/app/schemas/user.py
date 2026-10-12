import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.MANUFACTURER


class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None
    phone_number: Optional[str] = None
    company_registration_number: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data):
        if isinstance(data, dict):
            if not data.get("full_name") and data.get("company_name"):
                data["full_name"] = data["company_name"]
            if data.get("role") and str(data["role"]).upper() == "BUYER":
                data["role"] = UserRole.MANUFACTURER
        return data


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: uuid.UUID


class TokenPayload(BaseModel):
    sub: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
