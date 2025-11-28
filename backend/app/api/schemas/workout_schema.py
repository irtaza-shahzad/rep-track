# app/api/schemas/workout_schema.py
"""
Pydantic schemas for live workout functionality.
Designed to match frontend's data structures and workflow.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


# ============ WorkoutSet Schemas ============

class WorkoutSetBase(BaseModel):
    """Base set fields - matches frontend WorkoutSet interface"""
    reps: str = Field(default='', description="Reps as string for flexibility ('10', '8-10', etc.)")
    weight: str = Field(default='', description="Weight as string ('135.5', '100', etc.)")
    rpe: Optional[int] = Field(None, ge=1, le=10, description="Rate of Perceived Exertion (1-10)")
    completed: bool = Field(False, description="Whether set is completed")
    is_warmup: bool = Field(False, description="Warmup set flag")
    is_dropset: bool = Field(False, description="Dropset flag")
    is_failure: bool = Field(False, description="Taken to failure flag")


class WorkoutSetCreate(WorkoutSetBase):
    """Schema for adding a new set to an exercise"""
    pass


class WorkoutSetUpdate(BaseModel):
    """Schema for updating a set - all fields optional"""
    reps: Optional[str] = None
    weight: Optional[str] = None
    rpe: Optional[int] = Field(None, ge=1, le=10)
    completed: Optional[bool] = None
    is_warmup: Optional[bool] = None
    is_dropset: Optional[bool] = None
    is_failure: Optional[bool] = None


class WorkoutSetResponse(WorkoutSetBase):
    """Full set response with ID and metadata"""
    id: int
    position: int
    completed_at: Optional[int] = Field(None, description="Epoch ms when completed")
    
    model_config = {"from_attributes": True}


# ============ Exercise Schemas ============

class ExerciseInWorkout(BaseModel):
    """
    Exercise within a workout - matches frontend Exercise interface.
    Frontend uses { id, name, sets[] }
    """
    id: int
    name: str = Field(..., description="Exercise name")
    sets: List[WorkoutSetResponse] = Field(default_factory=list)
    notes: Optional[str] = None
    
    model_config = {"from_attributes": True}


class AddExerciseRequest(BaseModel):
    """Request to add an exercise to active workout"""
    exercise_name: str = Field(..., description="Name of exercise to add")


class ReorderExercisesRequest(BaseModel):
    """Request to reorder exercises in workout"""
    exercise_ids: List[int] = Field(..., description="Ordered list of workout_exercise IDs")


# ============ Active Workout Schemas ============

class StartWorkoutRequest(BaseModel):
    """
    Request to start a new workout.
    Can be empty or from a template.
    """
    template_id: Optional[int] = Field(None, description="Template ID to start from (null for empty workout)")
    workout_name: Optional[str] = Field(None, max_length=200, description="Optional workout name")


class UpdateWorkoutRequest(BaseModel):
    """
    Request to update active workout metadata or state.
    All fields optional - only update what's provided.
    """
    workout_name: Optional[str] = Field(None, max_length=200)
    elapsed_seconds: Optional[int] = Field(None, ge=0, description="Total elapsed seconds")
    is_paused: Optional[bool] = Field(None, description="Timer pause state")
    notes: Optional[str] = None


class ActiveWorkoutResponse(BaseModel):
    """
    Full active workout response - matches frontend WorkoutState interface.
    Frontend expects: { exercises, elapsedSeconds, isPaused, workoutNumber, workoutName, startTime }
    """
    id: int
    workout_number: int
    workout_name: Optional[str]
    start_time: int = Field(..., description="Epoch milliseconds")
    elapsed_seconds: int = Field(..., description="Total elapsed seconds")
    is_paused: bool
    is_active: bool
    exercises: List[ExerciseInWorkout] = Field(default_factory=list)
    notes: Optional[str] = None
    template_id: Optional[int] = None
    
    # Computed fields for floating indicator
    total_exercises: int = Field(0, description="Count of exercises")
    completed_sets: int = Field(0, description="Count of completed sets")
    
    model_config = {"from_attributes": True}


class FinishWorkoutRequest(BaseModel):
    """
    Request to finish workout.
    Final name can be provided here.
    """
    workout_name: Optional[str] = Field(None, max_length=200, description="Final workout name")


class CompletedWorkoutResponse(BaseModel):
    """Response after finishing a workout with computed analytics"""
    id: int
    workout_number: int
    workout_name: str
    start_time: int
    end_time: int
    elapsed_seconds: int
    total_volume: float
    total_sets: int
    total_reps: int
    exercises_count: int
    exercises: List[ExerciseInWorkout]
    
    model_config = {"from_attributes": True}


# ============ Workout History Schemas ============

class WorkoutHistorySummary(BaseModel):
    """Summary view of a completed workout for history list"""
    id: int
    workout_number: int
    workout_name: str
    start_time: int = Field(..., description="Epoch ms")
    elapsed_seconds: int = Field(..., description="Duration in seconds")
    total_volume: Optional[float] = None
    total_sets: Optional[int] = None
    exercises_count: Optional[int] = None
    
    model_config = {"from_attributes": True}


class WorkoutHistoryDetail(BaseModel):
    """Full workout details including all exercises and sets"""
    id: int
    workout_number: int
    workout_name: str
    start_time: int
    end_time: Optional[int]
    elapsed_seconds: int
    total_volume: Optional[float]
    total_sets: Optional[int]
    total_reps: Optional[int]
    exercises_count: Optional[int]
    notes: Optional[str]
    exercises: List[ExerciseInWorkout]
    template_id: Optional[int]
    
    model_config = {"from_attributes": True}


# ============ Stats Schemas ============

class WorkoutStatsResponse(BaseModel):
    """User's workout statistics"""
    total_workouts: int = Field(..., description="Total completed workouts")
    current_streak: int = Field(..., description="Current streak in days")
    total_volume: float = Field(..., description="Lifetime total volume")
    total_sets: int = Field(..., description="Lifetime total sets")
    
    model_config = {"from_attributes": True}
