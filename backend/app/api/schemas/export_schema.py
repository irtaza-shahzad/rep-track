from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ExportFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"


class ExportInclude(str, Enum):
    WORKOUTS = "workouts"
    STATS = "stats"
    STREAKS = "streaks"
    EXERCISES = "exercises"
    ALL = "all"


class ExportRequest(BaseModel):
    format: ExportFormat = Field(..., description="Export format: csv or pdf")
    include: List[ExportInclude] = Field(
        default=[ExportInclude.ALL],
        description="Data to include in export"
    )
    start_date: Optional[str] = Field(None, description="Start date for filtering (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date for filtering (YYYY-MM-DD)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "format": "pdf",
                "include": ["workouts", "stats", "streaks"],
                "start_date": "2025-01-01",
                "end_date": "2025-12-31"
            }
        }
    }
