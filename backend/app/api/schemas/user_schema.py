from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(..., description="Full name of the user")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="Password for authentication")

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
    name: Optional[str] = Field(None, description="Updated name of the user")
    password: Optional[str] = Field(None, description="New password for the account")

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