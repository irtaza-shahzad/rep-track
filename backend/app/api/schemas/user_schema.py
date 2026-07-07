from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password for authentication")

    @field_validator('name')
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z\s\-'.]+$", v):
            raise ValueError("Name may only contain letters, spaces, hyphens, apostrophes, or periods")
        return v

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "password": "StrongPass123!"
            }
        }
    }

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Updated name of the user")
    password: Optional[str] = Field(None, min_length=8, max_length=128, description="New password for the account")

    @field_validator('name')
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r"^[a-zA-Z\s\-'.]+$", v):
            raise ValueError("Name may only contain letters, spaces, hyphens, apostrophes, or periods")
        return v

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "John Doe",
                "password": "UpdatedPass456!"
            }
        }
    }

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 12,
                "name": "John Doe",
                "email": "john.doe@example.com",
                "created_at": "2025-10-08T21:44:25Z"
            }
        }
    }