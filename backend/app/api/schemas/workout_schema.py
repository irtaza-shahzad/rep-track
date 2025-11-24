# app/api/schemas/workout_schema.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class WorkoutStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============ WorkoutSet Schemas ============

class WorkoutSetBase(BaseModel):
    weight: Optional[float] = Field(None, description="Weight in kg or lbs")
    reps: Optional[int] = Field(None, description="Number of repetitions")
    duration_seconds: Optional[int] = Field(None, description="Duration for time-based exercises")
    distance: Optional[float] = Field(None, description="Distance for cardio exercises")
    rpe: Optional[int] = Field(None, ge=1, le=10, description="Rate of Perceived Exertion (1-10)")
    notes: Optional[str] = Field(None, max_length=500, description="Notes for this set")
    is_warmup: bool = Field(False, description="Whether this is a warmup set")
    is_dropset: bool = Field(False, description="Whether this is a dropset")
    is_failure: bool = Field(False, description="Whether this set was taken to failure")


class WorkoutSetCreate(WorkoutSetBase):
    set_number: int = Field(..., ge=1, description="Set number within the exercise")


class WorkoutSetUpdate(WorkoutSetBase):
    set_number: Optional[int] = Field(None, ge=1, description="Set number within the exercise")


class WorkoutSetResponse(WorkoutSetBase):
    id: int
    workout_exercise_id: int
    set_number: int

    model_config = {"from_attributes": True}


# ============ WorkoutExercise Schemas ============

class WorkoutExerciseBase(BaseModel):
    exercise_id: int = Field(..., description="ID of the exercise")
    position: int = Field(0, description="Order within the workout")
    notes: Optional[str] = Field(None, description="Notes for this exercise")


class WorkoutExerciseCreate(WorkoutExerciseBase):
    """Schema for adding an exercise to an active workout"""
    pass


class WorkoutExerciseUpdate(BaseModel):
    """Schema for updating an exercise in an active workout"""
    position: Optional[int] = Field(None, description="New position/order")
    notes: Optional[str] = Field(None, description="Updated notes")


class WorkoutExerciseResponse(WorkoutExerciseBase):
    id: int
    workout_session_id: int
    exercise_name: Optional[str] = Field(None, description="Name of the exercise (from relationship)")
    workout_sets: List[WorkoutSetResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
    
    @classmethod
    def model_validate(cls, obj, **kwargs):
        """Override to populate exercise_name from relationship"""
        if hasattr(obj, 'exercise') and obj.exercise:
            obj.exercise_name = obj.exercise.name
        else:
            obj.exercise_name = None
        return super().model_validate(obj, **kwargs)


# ============ WorkoutSession Schemas ============

class WorkoutSessionStart(BaseModel):
    """Schema for starting a new workout session"""
    template_id: Optional[int] = Field(None, description="Optional template ID to load")
    name: Optional[str] = Field(None, max_length=200, description="Optional workout name")
    notes: Optional[str] = Field(None, description="Optional workout notes")


class WorkoutSessionUpdate(BaseModel):
    """Schema for updating active workout metadata"""
    name: Optional[str] = Field(None, max_length=200, description="Updated workout name")
    notes: Optional[str] = Field(None, description="Updated workout notes")


class WorkoutSessionFinish(BaseModel):
    """Schema for finishing a workout - no required fields"""
    pass


class WorkoutSessionResponse(BaseModel):
    id: int
    user_id: int
    template_id: Optional[int] = None
    status: WorkoutStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    name: Optional[str] = None
    notes: Optional[str] = None
    total_volume: Optional[float] = None
    total_sets: Optional[int] = None
    total_reps: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    workout_exercises: List[WorkoutExerciseResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class WorkoutSessionSummary(BaseModel):
    """Summary response when finishing a workout"""
    id: int
    user_id: int
    status: WorkoutStatus
    start_time: datetime
    end_time: datetime
    duration_seconds: int
    name: Optional[str] = None
    total_volume: float
    total_sets: int
    total_reps: int
    exercises_count: int
    workout_exercises: List[WorkoutExerciseResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ============ Bulk Operations ============

class AddExerciseToWorkout(BaseModel):
    """Schema for adding an exercise to an active workout"""
    exercise_id: int = Field(..., description="ID of the exercise to add")
    position: Optional[int] = Field(None, description="Position in the workout (optional, will append if not provided)")
    notes: Optional[str] = Field(None, description="Notes for this exercise")


class AddSetToExercise(BaseModel):
    """Schema for adding a set to an exercise in an active workout"""
    workout_exercise_id: int = Field(..., description="ID of the workout exercise")
    set_number: int = Field(..., ge=1, description="Set number")
    weight: Optional[float] = None
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    distance: Optional[float] = None
    rpe: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=500)
    is_warmup: bool = False
    is_dropset: bool = False
    is_failure: bool = False


class ReorderExercises(BaseModel):
    """Schema for reordering exercises in a workout"""
    exercise_positions: List[dict] = Field(
        ..., 
        description="List of {workout_exercise_id: int, position: int} mappings"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "exercise_positions": [
                    {"workout_exercise_id": 1, "position": 1},
                    {"workout_exercise_id": 2, "position": 2},
                    {"workout_exercise_id": 3, "position": 3}
                ]
            }
        }
    }
