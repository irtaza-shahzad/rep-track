from pydantic import BaseModel
from enum import Enum

class ExportFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"

class ExportTimeRange(str, Enum):
    LAST_WEEK = "last_week"
    LAST_MONTH = "last_month"
    LAST_3_MONTHS = "last_3_months"
    LAST_6_MONTHS = "last_6_months"
    LAST_YEAR = "last_year"
    LAST_2_YEARS = "last_2_years"
    ALL_TIME = "all_time"

class ExportRequest(BaseModel):
    format: ExportFormat
    time_range: ExportTimeRange
