from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User's registered email address")
    password: str = Field(..., description="Password for authentication")

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "john.doe@example.com",
                "password": "StrongPass123!"
            }
        }
    }

class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token for authentication")
    token_type: str = Field("bearer", description="Type of token returned")
    expires_at: datetime = Field(..., description="Token expiration timestamp in UTC")

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_at": "2025-10-12T22:00:00Z"
            }
        }
    }
