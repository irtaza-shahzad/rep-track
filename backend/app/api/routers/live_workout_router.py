# app/api/routers/live_workout_router.py
"""
Clean implementation of live workout API endpoints.
All endpoints require authentication.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security.dependencies import verify_jwt
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response, created_response
from app.api.common.exception_responses import standard_responses
from app.api.schemas.workout_schema import (
    StartWorkoutRequest,
    UpdateWorkoutRequest,
    WorkoutStateResponse,
    ExerciseCreate,
    ExerciseResponse,
    WorkoutSetCreate,
    WorkoutSetUpdate,
    WorkoutSetResponse,
    FinishWorkoutResponse,
)
from app.api.services import live_workout_service


router = APIRouter(prefix="/api/live-workout", tags=["Live Workout"])


# ============ Workout Session Endpoints ============

@router.post(
    "/start",
    response_model=APIResponse,
    summary="Start a new live workout session",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def start_workout(
    data: StartWorkoutRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Start a new workout session.
    
    - Can start empty (no template_id) or from your own template
    - If template_id provided, it must be a template you own
    - Only one active workout allowed at a time
    - Returns the new active workout state
    """
    user_id = int(payload.get("sub"))
    workout = live_workout_service.start_workout(db, user_id, data)
    
    # Transform to response format
    response_data = _transform_to_workout_state(workout)
    return created_response(response_data, message="Workout started successfully")


@router.get(
    "/active",
    response_model=APIResponse,
    summary="Get the currently active workout",
    responses={**standard_responses},
)
def get_active_workout(
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Get the user's currently active workout session, if any.
    Returns null if no active workout exists.
    """
    user_id = int(payload.get("sub"))
    workout = live_workout_service.get_active_workout(db, user_id)
    
    if not workout:
        return success_response(None, message="No active workout")
    
    response_data = _transform_to_workout_state(workout)
    return success_response(response_data)


@router.get(
    "/{workout_id}",
    response_model=APIResponse,
    summary="Get a specific workout by ID",
    responses={**standard_responses},
)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Get a specific workout session by ID.
    Only the owner can access their workouts.
    """
    user_id = int(payload.get("sub"))
    workout = live_workout_service.get_workout_by_id(db, workout_id, user_id)
    
    response_data = _transform_to_workout_state(workout)
    return success_response(response_data)


@router.put(
    "/{workout_id}",
    response_model=APIResponse,
    summary="Update workout metadata",
    responses={**standard_responses},
)
def update_workout(
    workout_id: int,
    data: UpdateWorkoutRequest,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Update workout session metadata (name, pause state).
    Only active workouts can be updated.
    """
    user_id = int(payload.get("sub"))
    workout = live_workout_service.update_workout(db, workout_id, user_id, data)
    
    response_data = _transform_to_workout_state(workout)
    return success_response(response_data, message="Workout updated")


@router.post(
    "/{workout_id}/finish",
    response_model=APIResponse,
    summary="Finish an active workout",
    responses={**standard_responses},
)
def finish_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Finish an active workout session.
    Marks workout as completed and returns summary.
    """
    user_id = int(payload.get("sub"))
    workout = live_workout_service.finish_workout(db, workout_id, user_id)
    
    # Calculate elapsed seconds
    import time
    current_time_ms = int(time.time() * 1000)
    elapsed_seconds = (current_time_ms - workout.start_time) // 1000
    
    # Count sets
    total_sets = sum(len(ex.workout_sets) for ex in workout.workout_exercises)
    
    response_data = FinishWorkoutResponse(
        id=workout.id,
        workout_number=workout.workout_number,
        workout_name=workout.workout_name,
        start_time=workout.start_time,
        elapsed_seconds=elapsed_seconds,
        total_exercises=len(workout.workout_exercises),
        total_sets=total_sets
    )
    
    return success_response(response_data, message="Workout finished!")


@router.delete(
    "/{workout_id}",
    response_model=APIResponse,
    summary="Cancel/delete an active workout",
    status_code=status.HTTP_200_OK,
    responses={**standard_responses},
)
def cancel_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Cancel/delete an active workout session.
    This permanently removes the workout.
    """
    user_id = int(payload.get("sub"))
    live_workout_service.cancel_workout(db, workout_id, user_id)
    
    return success_response(None, message="Workout cancelled")


# ============ Exercise Management ============

@router.post(
    "/{workout_id}/exercises",
    response_model=APIResponse,
    summary="Add an exercise to the workout",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def add_exercise(
    workout_id: int,
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Add an exercise to an active workout.
    Exercise must exist in the database.
    """
    user_id = int(payload.get("sub"))
    workout_ex = live_workout_service.add_exercise(db, workout_id, user_id, data)
    
    response_data = ExerciseResponse(
        id=str(workout_ex.id),
        name=workout_ex.exercise.name,
        sets=[
            WorkoutSetResponse(
                id=s.id,
                position=s.position,
                reps=s.reps,
                weight=s.weight,
                rpe=s.rpe,
                completed=s.completed,
                isWarmup=s.is_warmup,
                isDropset=s.is_dropset,
                isFailure=s.is_failure
            )
            for s in workout_ex.workout_sets
        ]
    )
    
    return created_response(response_data, message="Exercise added")


@router.delete(
    "/exercises/{workout_exercise_id}",
    response_model=APIResponse,
    summary="Remove an exercise from the workout",
    status_code=status.HTTP_200_OK,
    responses={**standard_responses},
)
def remove_exercise(
    workout_exercise_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Remove an exercise from an active workout.
    All sets for this exercise will also be deleted.
    """
    user_id = int(payload.get("sub"))
    live_workout_service.remove_exercise(db, workout_exercise_id, user_id)
    
    return success_response(None, message="Exercise removed")


@router.put(
    "/{workout_id}/exercises/reorder",
    response_model=APIResponse,
    summary="Reorder exercises in the workout",
    responses={**standard_responses},
)
def reorder_exercises(
    workout_id: int,
    exercise_ids: List[int],
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Reorder exercises in the workout.
    Provide array of exercise IDs in desired order.
    """
    user_id = int(payload.get("sub"))
    workout = live_workout_service.reorder_exercises(db, workout_id, user_id, exercise_ids)
    
    response_data = _transform_to_workout_state(workout)
    return success_response(response_data, message="Exercises reordered")


# ============ Set Management ============

@router.post(
    "/exercises/{workout_exercise_id}/sets",
    response_model=APIResponse,
    summary="Add a set to an exercise",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def add_set(
    workout_exercise_id: int,
    data: WorkoutSetCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Add a set to an exercise in the workout.
    """
    user_id = int(payload.get("sub"))
    workout_set = live_workout_service.add_set(db, workout_exercise_id, user_id, data)
    
    response_data = WorkoutSetResponse(
        id=workout_set.id,
        position=workout_set.position,
        reps=workout_set.reps,
        weight=workout_set.weight,
        rpe=workout_set.rpe,
        completed=workout_set.completed,
        isWarmup=workout_set.is_warmup,
        isDropset=workout_set.is_dropset,
        isFailure=workout_set.is_failure
    )
    
    return created_response(response_data, message="Set added")


@router.put(
    "/sets/{set_id}",
    response_model=APIResponse,
    summary="Update a set",
    responses={**standard_responses},
)
def update_set(
    set_id: int,
    data: WorkoutSetUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Update a set in the workout.
    """
    user_id = int(payload.get("sub"))
    workout_set = live_workout_service.update_set(db, set_id, user_id, data)
    
    response_data = WorkoutSetResponse(
        id=workout_set.id,
        position=workout_set.position,
        reps=workout_set.reps,
        weight=workout_set.weight,
        rpe=workout_set.rpe,
        completed=workout_set.completed,
        isWarmup=workout_set.is_warmup,
        isDropset=workout_set.is_dropset,
        isFailure=workout_set.is_failure
    )
    
    return success_response(response_data, message="Set updated")


@router.delete(
    "/sets/{set_id}",
    response_model=APIResponse,
    summary="Remove a set",
    status_code=status.HTTP_200_OK,
    responses={**standard_responses},
)
def remove_set(
    set_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Remove a set from the workout.
    """
    user_id = int(payload.get("sub"))
    live_workout_service.remove_set(db, set_id, user_id)
    
    return success_response(None, message="Set removed")


# ============ Helper Functions ============

def _transform_to_workout_state(workout) -> dict:
    """Transform DB model to WorkoutState interface format."""
    import time
    
    # Calculate elapsed seconds
    current_time_ms = int(time.time() * 1000)
    elapsed_seconds = (current_time_ms - workout.start_time) // 1000 if workout.is_active else 0
    
    exercises = []
    for ex in sorted(workout.workout_exercises, key=lambda x: x.position):
        sets = [
            {
                "id": s.id,
                "position": s.position,
                "reps": s.reps,
                "weight": s.weight,
                "rpe": s.rpe,
                "completed": s.completed,
                "isWarmup": s.is_warmup,
                "isDropset": s.is_dropset,
                "isFailure": s.is_failure,
            }
            for s in sorted(ex.workout_sets, key=lambda x: x.position)
        ]
        
        exercises.append({
            "id": str(ex.id),
            "name": ex.exercise.name if ex.exercise else "Unknown",
            "sets": sets
        })
    
    return {
        "id": workout.id,
        "exercises": exercises,
        "elapsedSeconds": elapsed_seconds,
        "isPaused": workout.is_paused,
        "workoutNumber": workout.workout_number,
        "workoutName": workout.workout_name,
        "startTime": workout.start_time
    }
