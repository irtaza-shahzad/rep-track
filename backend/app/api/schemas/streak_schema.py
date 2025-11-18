from pydantic import BaseModel, Field
from datetime import date

class StreakBase(BaseModel):
    current_streak: int
    longest_streak: int
    last_trained_date: date | None = None
    target_days_per_week: int
    workouts_this_week: int
    week_start_date: date | None = None

class StreakCreate(BaseModel):
    target_days_per_week: int = Field(..., ge=1, le=7, description="Target workout days per week (1-7)")

class StreakUpdate(BaseModel):
    target_days_per_week: int = Field(..., ge=1, le=7, description="Target workout days per week (1-7)")

class StreakResponse(StreakBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}