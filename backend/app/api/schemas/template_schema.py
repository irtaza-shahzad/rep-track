# app/api/schemas/template_schema.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TemplateExerciseBase(BaseModel):
    exercise_name: str = Field(..., description="Name of the exercise (system will resolve to ID)")
    position: Optional[int] = Field(default=0, description="Order of exercise in template")
    sets: Optional[int] = None
    reps: Optional[int] = None
    duration_seconds: Optional[int] = Field(None, description="Duration of exercise in seconds (optional)", example=60)
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None


class TemplateExerciseCreate(TemplateExerciseBase):
    pass


class TemplateExerciseUpdate(BaseModel):
    id: Optional[int] = Field(None, description="ID of the template exercise (required for existing exercises)")
    exercise_name: Optional[str] = Field(None, description="New exercise name (optional)")
    position: Optional[int] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None



class TemplateExerciseOut(BaseModel):
    id: int
    exercise_id: int
    exercise_name: Optional[str] = None 
    position: Optional[int] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class WorkoutTemplateBase(BaseModel):
    name: str = Field(..., example="Push Day Routine")
    description: Optional[str] = Field(None, example="Chest, shoulders, and triceps workout")


class WorkoutTemplateCreate(WorkoutTemplateBase):
    exercises: Optional[List[TemplateExerciseCreate]] = Field(
        default=[],
        description="List of exercises included in this workout template",
        example=[
            {
                "exercise_name": "Bench Press",
                "position": 1,
                "sets": 3,
                "reps": 10,
                "duration_seconds": 60,
                "rest_seconds": 60,
                "notes": "Use moderate weight"
            }
        ]
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Push Day Routine",
                "description": "Chest, shoulders, and triceps workout",
                "exercises": [
                    {
                        "exercise_name": "Bench Press",
                        "position": 1,
                        "sets": 3,
                        "reps": 10,
                        "duration_seconds": 60,
                        "rest_seconds": 60,
                        "notes": "Use moderate weight"
                    }
                ]
            }
        }
    }


class WorkoutTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    exercises: Optional[List[TemplateExerciseUpdate]] = None


class WorkoutTemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    template_exercises: List[TemplateExerciseOut] = []

    model_config = {
        "from_attributes": True
    }
