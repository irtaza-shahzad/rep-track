from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class MuscleGroup(str, Enum):
    CHEST = "Chest"
    BACK = "Back"
    SHOULDERS = "Shoulders"
    ARMS = "Arms"
    LEGS = "Legs"
    CORE = "Core"
    FULL_BODY = "FullBody"
    OTHER = "Other"

class Category(str, Enum):
    STRENGTH = "Strength"
    CARDIO = "Cardio"
    FLEXIBILITY = "Flexibility"
    MOBILITY = "Mobility"
    OTHER = "Other"

class Difficulty(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class ExerciseCreate(BaseModel):
    name: str = Field(..., description="Name of the exercise")
    description: Optional[str] = Field(None, description="Description or instructions for the exercise")
    category: Category = Field(..., description="Category of the exercise (e.g. Strength, Cardio)")
    difficulty: Difficulty = Field(..., description="Difficulty level (Beginner, Intermediate, Advanced)")
    muscle_group: MuscleGroup = Field(..., description="Targeted muscle group for the exercise")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Bench Press",
                "description": "A strength exercise that targets the chest and triceps.",
                "category": "Strength",
                "difficulty": "Intermediate",
                "muscle_group": "Chest"
            }
        }
    }

class ExerciseUpdate(BaseModel):
    description: Optional[str] = Field(None, description="Updated description of the exercise")
    category: Optional[Category] = Field(None, description="Updated category")
    difficulty: Optional[Difficulty] = Field(None, description="Updated difficulty")
    muscle_group: Optional[MuscleGroup] = Field(None, description="Updated targeted muscle group")

    model_config = {
        "json_schema_extra": {
            "example": {
                "description": "Modified version with proper form.",
                "category": "Strength",
                "difficulty": "Advanced",
                "muscle_group": "Chest"
            }
        }
    }

class ExerciseResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Category
    difficulty: Difficulty
    muscle_group: MuscleGroup
    user_id: Optional[int]
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 5,
                "name": "Bench Press",
                "description": "A chest exercise using a barbell.",
                "category": "Strength",
                "difficulty": "Intermediate",
                "muscle_group": "Chest",
                "user_id": 2,
                "created_at": "2025-10-08T21:44:25Z"
            }
        }
    }