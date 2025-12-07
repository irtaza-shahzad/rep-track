# app/api/routers/active_workout_router.py
"""
REST API endpoints for live workout functionality.
Supports the complete workout lifecycle as described in requirements.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.services.auth_service import get_current_user
from app.models.user_model import User
from app.api.services import streak_service
from app.api.schemas.workout_schema import (
    StartWorkoutRequest,
    UpdateWorkoutRequest,
    AddExerciseRequest,
    WorkoutSetCreate,
    WorkoutSetUpdate,
    FinishWorkoutRequest,
    ActiveWorkoutResponse,
    CompletedWorkoutResponse,
    WorkoutHistorySummary,
    WorkoutHistoryDetail,
    WorkoutStatsResponse,
    ExerciseInWorkout,
    WorkoutSetResponse,
)
from app.api.services import active_workout_service


router = APIRouter(prefix="/api/workouts", tags=["Active Workout"])


# ============ Active Workout Management ============

@router.post(
    "/active",
    response_model=ActiveWorkoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new workout",
    description="Start a new workout session (empty or from template). Only one active workout per user."
)
def start_workout(
    data: StartWorkoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new workout session.
    
    - **template_id**: Optional. If provided, initializes workout with exercises from template.
    - **workout_name**: Optional. Custom name for the workout.
    
    Returns the created active workout with all details.
    
    **Error cases:**
    - 400: User already has an active workout
    - 404: Template not found (if template_id provided)
    """
    workout = active_workout_service.start_workout(db, current_user.id, data)
    
    # Build response matching frontend structure
    exercises = []
    for ex in workout.workout_exercises:
        sets = [
            WorkoutSetResponse(
                id=s.id,
                position=s.position,
                reps=s.reps,
                weight=s.weight,
                rpe=s.rpe,
                completed=s.completed,
                is_warmup=s.is_warmup,
                is_dropset=s.is_dropset,
                is_failure=s.is_failure,
                completed_at=s.completed_at
            )
            for s in ex.workout_sets
        ]
        exercises.append(ExerciseInWorkout(
            id=ex.id,
            name=ex.exercise_name,
            sets=sets,
            notes=ex.notes
        ))
    
    completed_count = sum(
        len([s for s in ex.workout_sets if s.completed])
        for ex in workout.workout_exercises
    )
    
    return ActiveWorkoutResponse(
        id=workout.id,
        workout_number=workout.workout_number,
        workout_name=workout.workout_name,
        start_time=workout.start_time,
        elapsed_seconds=workout.elapsed_seconds,
        is_paused=workout.is_paused,
        is_active=workout.is_active,
        exercises=exercises,
        notes=workout.notes,
        template_id=workout.template_id,
        total_exercises=len(exercises),
        completed_sets=completed_count
    )


@router.get(
    "/active",
    response_model=ActiveWorkoutResponse,
    summary="Get active workout",
    description="Get the current active workout for the authenticated user."
)
def get_active_workout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve the user's currently active workout.
    
    Returns full workout details including all exercises and sets.
    
    **Error cases:**
    - 404: No active workout found
    """
    workout = active_workout_service.get_active_workout(db, current_user.id)
    
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    # Build response
    exercises = []
    for ex in workout.workout_exercises:
        sets = [
            WorkoutSetResponse(
                id=s.id,
                position=s.position,
                reps=s.reps,
                weight=s.weight,
                rpe=s.rpe,
                completed=s.completed,
                is_warmup=s.is_warmup,
                is_dropset=s.is_dropset,
                is_failure=s.is_failure,
                completed_at=s.completed_at
            )
            for s in ex.workout_sets
        ]
        exercises.append(ExerciseInWorkout(
            id=ex.id,
            name=ex.exercise_name,
            sets=sets,
            notes=ex.notes
        ))
    
    completed_count = sum(
        len([s for s in ex.workout_sets if s.completed])
        for ex in workout.workout_exercises
    )
    
    return ActiveWorkoutResponse(
        id=workout.id,
        workout_number=workout.workout_number,
        workout_name=workout.workout_name,
        start_time=workout.start_time,
        elapsed_seconds=workout.elapsed_seconds,
        is_paused=workout.is_paused,
        is_active=workout.is_active,
        exercises=exercises,
        notes=workout.notes,
        template_id=workout.template_id,
        total_exercises=len(exercises),
        completed_sets=completed_count
    )


@router.patch(
    "/active",
    response_model=ActiveWorkoutResponse,
    summary="Update active workout",
    description="Update metadata of the active workout (name, elapsed time, pause state)."
)
def update_active_workout(
    data: UpdateWorkoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update active workout metadata.
    
    All fields are optional - only provided fields will be updated.
    
    - **workout_name**: Update workout name
    - **elapsed_seconds**: Update elapsed time
    - **is_paused**: Update pause state
    - **notes**: Update notes
    
    **Error cases:**
    - 404: No active workout found
    """
    workout = active_workout_service.update_workout(db, current_user.id, data)
    
    # Build response
    exercises = []
    for ex in workout.workout_exercises:
        sets = [
            WorkoutSetResponse(
                id=s.id,
                position=s.position,
                reps=s.reps,
                weight=s.weight,
                rpe=s.rpe,
                completed=s.completed,
                is_warmup=s.is_warmup,
                is_dropset=s.is_dropset,
                is_failure=s.is_failure,
                completed_at=s.completed_at
            )
            for s in ex.workout_sets
        ]
        exercises.append(ExerciseInWorkout(
            id=ex.id,
            name=ex.exercise_name,
            sets=sets,
            notes=ex.notes
        ))
    
    completed_count = sum(
        len([s for s in ex.workout_sets if s.completed])
        for ex in workout.workout_exercises
    )
    
    return ActiveWorkoutResponse(
        id=workout.id,
        workout_number=workout.workout_number,
        workout_name=workout.workout_name,
        start_time=workout.start_time,
        elapsed_seconds=workout.elapsed_seconds,
        is_paused=workout.is_paused,
        is_active=workout.is_active,
        exercises=exercises,
        notes=workout.notes,
        template_id=workout.template_id,
        total_exercises=len(exercises),
        completed_sets=completed_count
    )


@router.post(
    "/active/finish",
    response_model=CompletedWorkoutResponse,
    summary="Finish active workout",
    description="Complete the active workout, compute analytics, and persist to history."
)
def finish_workout(
    data: FinishWorkoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finish the active workout.
    
    - Marks workout as completed
    - Computes total volume, sets, reps
    - Persists to workout history
    - Clears active workout status
    - Logs workout to user's streak (if streak is started)
    
    - **workout_name**: Optional final name for the workout
    
    **Error cases:**
    - 404: No active workout found
    """
    workout = active_workout_service.finish_workout(db, current_user.id, data)
    
    # Log workout to streak (silently fails if user hasn't started streak)
    try:
        streak_service.log_workout(db, current_user.id)
    except Exception as e:
        # Don't fail workout completion if streak logging fails
        print(f"Failed to log workout to streak: {e}")
    
    # Build response
    exercises = []
    for ex in workout.workout_exercises:
        sets = [
            WorkoutSetResponse(
                id=s.id,
                position=s.position,
                reps=s.reps,
                weight=s.weight,
                rpe=s.rpe,
                completed=s.completed,
                is_warmup=s.is_warmup,
                is_dropset=s.is_dropset,
                is_failure=s.is_failure,
                completed_at=s.completed_at
            )
            for s in ex.workout_sets
        ]
        exercises.append(ExerciseInWorkout(
            id=ex.id,
            name=ex.exercise_name,
            sets=sets,
            notes=ex.notes
        ))
    
    return CompletedWorkoutResponse(
        id=workout.id,
        workout_number=workout.workout_number,
        workout_name=workout.workout_name,
        start_time=workout.start_time,
        end_time=workout.end_time,
        elapsed_seconds=workout.elapsed_seconds,
        total_volume=workout.total_volume,
        total_sets=workout.total_sets,
        total_reps=workout.total_reps,
        exercises_count=workout.exercises_count,
        exercises=exercises
    )


@router.post(
    "/active/cancel",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel active workout",
    description="Cancel and delete the active workout without saving to history."
)
def cancel_workout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel the active workout.
    
    - Deletes the workout completely
    - No history is preserved
    - User can start a new workout after this
    
    **Error cases:**
    - 404: No active workout found
    """
    active_workout_service.cancel_workout(db, current_user.id)
    return None


# ============ Exercise Management ============

@router.post(
    "/active/exercises",
    response_model=ExerciseInWorkout,
    status_code=status.HTTP_201_CREATED,
    summary="Add exercise to workout",
    description="Add a new exercise to the active workout."
)
def add_exercise(
    data: AddExerciseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add an exercise to the active workout.
    
    - **exercise_name**: Name of the exercise to add
    
    Creates the exercise with one empty set by default.
    
    **Error cases:**
    - 404: No active workout found
    """
    exercise = active_workout_service.add_exercise_to_workout(db, current_user.id, data)
    
    sets = [
        WorkoutSetResponse(
            id=s.id,
            position=s.position,
            reps=s.reps,
            weight=s.weight,
            rpe=s.rpe,
            completed=s.completed,
            is_warmup=s.is_warmup,
            is_dropset=s.is_dropset,
            is_failure=s.is_failure,
            completed_at=s.completed_at
        )
        for s in exercise.workout_sets
    ]
    
    return ExerciseInWorkout(
        id=exercise.id,
        name=exercise.exercise_name,
        sets=sets,
        notes=exercise.notes
    )


@router.delete(
    "/active/exercises/{exercise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove exercise from workout",
    description="Remove an exercise and all its sets from the active workout."
)
def remove_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove an exercise from the active workout.
    
    - **exercise_id**: ID of the workout exercise to remove
    
    **Error cases:**
    - 404: No active workout found or exercise not found
    """
    active_workout_service.remove_exercise_from_workout(db, current_user.id, exercise_id)
    return None


# ============ Set Management ============

@router.post(
    "/active/exercises/{exercise_id}/sets",
    response_model=WorkoutSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add set to exercise",
    description="Add a new set to an exercise in the active workout."
)
def add_set(
    exercise_id: int,
    data: WorkoutSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a set to an exercise.
    
    - **exercise_id**: ID of the workout exercise
    - **data**: Set data (reps, weight, flags, etc.)
    
    **Error cases:**
    - 404: No active workout found or exercise not found
    """
    workout_set = active_workout_service.add_set_to_exercise(db, current_user.id, exercise_id, data)
    
    return WorkoutSetResponse(
        id=workout_set.id,
        position=workout_set.position,
        reps=workout_set.reps,
        weight=workout_set.weight,
        rpe=workout_set.rpe,
        completed=workout_set.completed,
        is_warmup=workout_set.is_warmup,
        is_dropset=workout_set.is_dropset,
        is_failure=workout_set.is_failure,
        completed_at=workout_set.completed_at
    )


@router.patch(
    "/active/sets/{set_id}",
    response_model=WorkoutSetResponse,
    summary="Update set",
    description="Update a set in the active workout."
)
def update_set(
    set_id: int,
    data: WorkoutSetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a set's data.
    
    - **set_id**: ID of the workout set
    - **data**: Updated set data (all fields optional)
    
    **Error cases:**
    - 404: No active workout found or set not found
    """
    workout_set = active_workout_service.update_set(db, current_user.id, set_id, data)
    
    return WorkoutSetResponse(
        id=workout_set.id,
        position=workout_set.position,
        reps=workout_set.reps,
        weight=workout_set.weight,
        rpe=workout_set.rpe,
        completed=workout_set.completed,
        is_warmup=workout_set.is_warmup,
        is_dropset=workout_set.is_dropset,
        is_failure=workout_set.is_failure,
        completed_at=workout_set.completed_at
    )


@router.delete(
    "/active/sets/{set_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete set",
    description="Delete a set from the active workout."
)
def delete_set(
    set_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a set.
    
    - **set_id**: ID of the workout set to delete
    
    **Error cases:**
    - 404: No active workout found or set not found
    """
    active_workout_service.delete_set(db, current_user.id, set_id)
    return None


# ============ Workout History ============

@router.get(
    "",
    response_model=List[WorkoutHistorySummary],
    summary="Get workout history",
    description="Get list of completed workouts for the user."
)
def get_workout_history(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's workout history.
    
    - **limit**: Maximum number of workouts to return (default: 50)
    - **offset**: Number of workouts to skip (default: 0)
    
    Returns list of completed workouts ordered by most recent first.
    """
    workouts = active_workout_service.get_workout_history(db, current_user.id, limit, offset)
    
    return [
        WorkoutHistorySummary(
            id=w.id,
            workout_number=w.workout_number,
            workout_name=w.workout_name,
            start_time=w.start_time,
            elapsed_seconds=w.elapsed_seconds,
            total_volume=w.total_volume,
            total_sets=w.total_sets,
            exercises_count=w.exercises_count
        )
        for w in workouts
    ]


@router.get(
    "/{workout_id}",
    response_model=WorkoutHistoryDetail,
    summary="Get workout details",
    description="Get full details of a specific workout."
)
def get_workout_details(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific workout.
    
    - **workout_id**: ID of the workout
    
    Returns complete workout data including all exercises and sets.
    
    **Error cases:**
    - 404: Workout not found
    """
    workout = active_workout_service.get_workout_by_id(db, current_user.id, workout_id)
    
    exercises = []
    for ex in workout.workout_exercises:
        sets = [
            WorkoutSetResponse(
                id=s.id,
                position=s.position,
                reps=s.reps,
                weight=s.weight,
                rpe=s.rpe,
                completed=s.completed,
                is_warmup=s.is_warmup,
                is_dropset=s.is_dropset,
                is_failure=s.is_failure,
                completed_at=s.completed_at
            )
            for s in ex.workout_sets
        ]
        exercises.append(ExerciseInWorkout(
            id=ex.id,
            name=ex.exercise_name,
            sets=sets,
            notes=ex.notes
        ))
    
    return WorkoutHistoryDetail(
        id=workout.id,
        workout_number=workout.workout_number,
        workout_name=workout.workout_name,
        start_time=workout.start_time,
        end_time=workout.end_time,
        elapsed_seconds=workout.elapsed_seconds,
        total_volume=workout.total_volume,
        total_sets=workout.total_sets,
        total_reps=workout.total_reps,
        exercises_count=workout.exercises_count,
        notes=workout.notes,
        exercises=exercises,
        template_id=workout.template_id
    )


# ============ Statistics ============

@router.get(
    "/stats/summary",
    response_model=WorkoutStatsResponse,
    summary="Get workout statistics",
    description="Get user's overall workout statistics."
)
def get_workout_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's workout statistics.
    
    Returns:
    - Total completed workouts
    - Current streak (days)
    - Total volume lifted
    - Total sets completed
    """
    stats = active_workout_service.get_workout_stats(db, current_user.id)
    
    return WorkoutStatsResponse(
        total_workouts=stats["total_workouts"],
        current_streak=stats["current_streak"],
        total_volume=stats["total_volume"],
        total_sets=stats["total_sets"]
    )
