# app/api/routers/workout_router.py
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security.dependencies import verify_jwt
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response, created_response
from app.api.common.exception_responses import standard_responses
from app.api.schemas.workout_schema import (
    WorkoutSessionStart,
    WorkoutSessionUpdate,
    WorkoutSessionResponse,
    WorkoutSessionSummary,
    WorkoutExerciseCreate,
    WorkoutExerciseUpdate,
    WorkoutExerciseResponse,
    WorkoutSetCreate,
    WorkoutSetUpdate,
    WorkoutSetResponse,
    ReorderExercises,
)
# Import from modular workout service package
from app.api.services import workout as workout_service


router = APIRouter(prefix="/api/workouts", tags=["Workouts"])


# ============ Workout Session Endpoints ============

@router.post(
    "/start",
    response_model=APIResponse,
    summary="Start a new live workout session",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def start_workout(
    data: WorkoutSessionStart,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Start a new workout session (active).
    
    - Can start empty or from YOUR OWN template
    - If template_id is provided, it MUST be a template you own
    - Exercises will be copied from your template
    - Returns the new active workout session
    
    Security: Cannot use templates belonging to other users (HTTP 403)
    """
    user_id = payload.get("sub")
    session = workout_service.start_workout_session(db, user_id, data)
    response_data = WorkoutSessionResponse.model_validate(session)
    return created_response(response_data)


@router.get(
    "/active",
    response_model=APIResponse,
    summary="Get the currently active workout session",
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
    user_id = payload.get("sub")
    session = workout_service.get_active_workout(db, user_id)
    
    if session:
        response_data = WorkoutSessionResponse.model_validate(session)
        return success_response(response_data)
    else:
        return success_response(None, message="No active workout session")


@router.get(
    "/",
    response_model=APIResponse,
    summary="Get all workout sessions for the user",
    responses={**standard_responses},
)
def get_all_workouts(
    status_filter: Optional[str] = Query(None, description="Filter by status: active, completed, cancelled"),
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Get all workout sessions for the authenticated user.
    
    - Optionally filter by status (active, completed, cancelled)
    - Ordered by start_time descending (newest first)
    """
    user_id = payload.get("sub")
    sessions = workout_service.get_all_workout_sessions(db, user_id, status_filter)
    response_data = [WorkoutSessionResponse.model_validate(s) for s in sessions]
    return success_response(response_data)


@router.get(
    "/{session_id}",
    response_model=APIResponse,
    summary="Get a specific workout session by ID",
    responses={**standard_responses},
)
def get_workout_by_id(
    session_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Get a specific workout session by ID.
    
    - Includes all exercises and sets
    - Security guard: only owner can access
    """
    user_id = payload.get("sub")
    session = workout_service.get_workout_session_by_id(db, session_id, user_id)
    response_data = WorkoutSessionResponse.model_validate(session)
    return success_response(response_data)


@router.put(
    "/{session_id}",
    response_model=APIResponse,
    summary="Update workout session metadata",
    responses={**standard_responses},
)
def update_workout(
    session_id: int,
    data: WorkoutSessionUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Update workout session metadata (name, notes).
    
    - Only active workouts can be updated
    - Security guard: only owner can update
    """
    user_id = payload.get("sub")
    session = workout_service.update_workout_session(db, session_id, user_id, data)
    response_data = WorkoutSessionResponse.model_validate(session)
    return success_response(response_data, message="Workout session updated successfully")


@router.post(
    "/{session_id}/finish",
    response_model=APIResponse,
    summary="Finish an active workout session",
    responses={**standard_responses},
)
def finish_workout(
    session_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Finish an active workout session.
    
    - Computes duration
    - Discards invalid/empty sets
    - Calculates analytics (volume, total reps, total sets)
    - Marks as COMPLETED
    - Returns final workout summary
    """
    user_id = payload.get("sub")
    session = workout_service.finish_workout_session(db, session_id, user_id)
    
    # Build summary response
    summary = WorkoutSessionSummary(
        id=session.id,
        user_id=session.user_id,
        status=session.status,
        start_time=session.start_time,
        end_time=session.end_time,
        duration_seconds=session.duration_seconds,
        name=session.name,
        total_volume=session.total_volume or 0.0,
        total_sets=session.total_sets or 0,
        total_reps=session.total_reps or 0,
        exercises_count=len(session.workout_exercises),
        workout_exercises=[WorkoutExerciseResponse.model_validate(ex) for ex in session.workout_exercises]
    )
    
    return success_response(summary, message="Workout finished successfully!")


@router.post(
    "/{session_id}/cancel",
    response_model=APIResponse,
    summary="Cancel an active workout session",
    responses={**standard_responses},
)
def cancel_workout(
    session_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Cancel an active workout session.
    
    - Marks workout as CANCELLED
    - Data is preserved but not counted in analytics
    """
    user_id = payload.get("sub")
    session = workout_service.cancel_workout_session(db, session_id, user_id)
    response_data = WorkoutSessionResponse.model_validate(session)
    return success_response(response_data, message="Workout cancelled")


@router.delete(
    "/{session_id}",
    response_model=APIResponse,
    summary="Delete a workout session permanently",
    status_code=status.HTTP_200_OK,
    responses={**standard_responses},
)
def delete_workout(
    session_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Permanently delete a workout session.
    
    - Deletes all associated exercises and sets (cascade)
    - Security guard: only owner can delete
    """
    user_id = payload.get("sub")
    workout_service.delete_workout_session(db, session_id, user_id)
    return success_response(None, message="Workout session deleted successfully")


# ============ Exercise Management Within Session ============

@router.post(
    "/{session_id}/exercises",
    response_model=APIResponse,
    summary="Add an exercise to an active workout",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def add_exercise_to_workout(
    session_id: int,
    data: WorkoutExerciseCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Add an exercise to an active workout session.
    
    - Only active workouts can be modified
    - Exercise must exist in the database
    - Security guard: only owner can add exercises
    """
    user_id = payload.get("sub")
    workout_ex = workout_service.add_exercise_to_session(db, session_id, user_id, data)
    response_data = WorkoutExerciseResponse.model_validate(workout_ex)
    return created_response(response_data)


@router.put(
    "/exercises/{workout_exercise_id}",
    response_model=APIResponse,
    summary="Update a workout exercise",
    responses={**standard_responses},
)
def update_exercise_in_workout(
    workout_exercise_id: int,
    data: WorkoutExerciseUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Update a workout exercise (position, notes).
    
    - Only active workouts can be modified
    - Security guard: only owner can update
    """
    user_id = payload.get("sub")
    workout_ex = workout_service.update_workout_exercise(db, workout_exercise_id, user_id, data)
    response_data = WorkoutExerciseResponse.model_validate(workout_ex)
    return success_response(response_data, message="Exercise updated successfully")


@router.delete(
    "/exercises/{workout_exercise_id}",
    response_model=APIResponse,
    summary="Remove an exercise from an active workout",
    status_code=status.HTTP_200_OK,
    responses={**standard_responses},
)
def remove_exercise_from_workout(
    workout_exercise_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Remove an exercise from an active workout session.
    
    - Deletes all associated sets (cascade)
    - Only active workouts can be modified
    - Security guard: only owner can remove
    """
    user_id = payload.get("sub")
    workout_service.remove_exercise_from_session(db, workout_exercise_id, user_id)
    return success_response(None, message="Exercise removed from workout")


@router.post(
    "/{session_id}/exercises/reorder",
    response_model=APIResponse,
    summary="Reorder exercises in a workout",
    responses={**standard_responses},
)
def reorder_exercises_in_workout(
    session_id: int,
    data: ReorderExercises,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Reorder exercises within a workout session.
    
    - Provide a list of workout_exercise_id and new position pairs
    - Only active workouts can be modified
    - Security guard: only owner can reorder
    """
    user_id = payload.get("sub")
    session = workout_service.reorder_exercises(db, session_id, user_id, data.exercise_positions)
    response_data = WorkoutSessionResponse.model_validate(session)
    return success_response(response_data, message="Exercises reordered successfully")


# ============ Set Management ============

@router.post(
    "/exercises/{workout_exercise_id}/sets",
    response_model=APIResponse,
    summary="Add a set to a workout exercise",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def add_set_to_exercise(
    workout_exercise_id: int,
    data: WorkoutSetCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Add a set to a workout exercise.
    
    - All fields (weight, reps, etc.) are optional
    - Invalid/empty sets will be discarded when finishing the workout
    - Only active workouts can be modified
    - Security guard: only owner can add sets
    """
    user_id = payload.get("sub")
    workout_set = workout_service.add_set_to_exercise(db, workout_exercise_id, user_id, data)
    response_data = WorkoutSetResponse.model_validate(workout_set)
    return created_response(response_data)


@router.put(
    "/sets/{set_id}",
    response_model=APIResponse,
    summary="Update a workout set",
    responses={**standard_responses},
)
def update_workout_set(
    set_id: int,
    data: WorkoutSetUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Update a workout set.
    
    - Update weight, reps, RPE, notes, etc.
    - Only active workouts can be modified
    - Security guard: only owner can update
    """
    user_id = payload.get("sub")
    workout_set = workout_service.update_set(db, set_id, user_id, data)
    response_data = WorkoutSetResponse.model_validate(workout_set)
    return success_response(response_data, message="Set updated successfully")


@router.delete(
    "/sets/{set_id}",
    response_model=APIResponse,
    summary="Delete a workout set",
    status_code=status.HTTP_200_OK,
    responses={**standard_responses},
)
def delete_workout_set(
    set_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    """
    Delete a workout set.
    
    - Only active workouts can be modified
    - Security guard: only owner can delete
    """
    user_id = payload.get("sub")
    workout_service.delete_set(db, set_id, user_id)
    return success_response(None, message="Set deleted successfully")
