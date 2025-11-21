from pydantic import BaseModel, Field, field_validator
from datetime import time, datetime
from typing import Optional

class ReminderBase(BaseModel):
    reminder_type: str = Field(..., description="Type of reminder: Scheduled, DailyGoal, WeeklyTarget, StreakRisk, Milestone")
    title: str = Field(..., min_length=1, max_length=200, description="Reminder title")
    description: Optional[str] = Field(None, max_length=500, description="Optional reminder description")
    scheduled_time: Optional[str] = Field(None, description="Time in 24-hour format (HH:MM), e.g., '18:30' for 6:30 PM", pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    days_of_week: Optional[list[int]] = Field(None, description="Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday")
    is_active: bool = Field(True, description="Whether reminder is active")

    @field_validator('days_of_week')
    @classmethod
    def validate_days(cls, v):
        if v is not None:
            if not all(0 <= day <= 6 for day in v):
                raise ValueError("days_of_week must contain values between 0 and 6 (0=Sunday, 6=Saturday)")
            if len(v) != len(set(v)):
                raise ValueError("days_of_week must not contain duplicates")
        return v

    @field_validator('reminder_type')
    @classmethod
    def validate_type(cls, v):
        valid_types = ["Scheduled", "DailyGoal", "WeeklyTarget", "StreakRisk", "Milestone"]
        if v not in valid_types:
            raise ValueError(f"reminder_type must be one of: {', '.join(valid_types)}")
        return v
    
    @field_validator('scheduled_time')
    @classmethod
    def validate_time_format(cls, v):
        if v is not None and v != '':
            # Validate format HH:MM
            try:
                parts = v.split(':')
                if len(parts) != 2:
                    raise ValueError
                hour, minute = int(parts[0]), int(parts[1])
                if not (0 <= hour <= 23 and 0 <= minute <= 59):
                    raise ValueError
            except:
                raise ValueError("scheduled_time must be in format HH:MM (24-hour), e.g., '18:30'")
        return v

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    scheduled_time: Optional[str] = Field(None, pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    days_of_week: Optional[list[int]] = None
    is_active: Optional[bool] = None

    @field_validator('days_of_week')
    @classmethod
    def validate_days(cls, v):
        if v is not None:
            if not all(0 <= day <= 6 for day in v):
                raise ValueError("days_of_week must contain values between 0 and 6 (0=Sunday, 6=Saturday)")
            if len(v) != len(set(v)):
                raise ValueError("days_of_week must not contain duplicates")
        return v
    
    @field_validator('scheduled_time')
    @classmethod
    def validate_time_format(cls, v):
        if v is not None and v != '':
            try:
                parts = v.split(':')
                if len(parts) != 2:
                    raise ValueError
                hour, minute = int(parts[0]), int(parts[1])
                if not (0 <= hour <= 23 and 0 <= minute <= 59):
                    raise ValueError
            except:
                raise ValueError("scheduled_time must be in format HH:MM (24-hour), e.g., '18:30'")
        return v

class ReminderResponse(BaseModel):
    id: int
    user_id: int
    reminder_type: str
    title: str
    description: Optional[str]
    scheduled_time: Optional[str]
    days_of_week: Optional[list[int]]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
