from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional
from fastapi import status
from datetime import datetime, timezone

class APIResponse(BaseModel):
    data: Optional[Any] = None
    status_code: int
    status_message: str
    timestamp: datetime

def make_response(data: Any = None, message: str = "Success", code: int = status.HTTP_200_OK):
    return APIResponse(
        data=data,
        status_code=code,
        status_message=message,
        timestamp=datetime.now(timezone.utc)
    )