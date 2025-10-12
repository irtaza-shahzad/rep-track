from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.schemas.exercise_schema import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from app.api.services import exercise_service
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response, created_response
from app.api.common.exception_responses import standard_responses

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


# Temporary mock user (to be replaced later with JWT or auth system)
TEMP_USER_ID = 1


@router.post(
    "/",
    response_model=APIResponse,
    summary="Create a new exercise",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def create_exercise(exercise: ExerciseCreate, db: Session = Depends(get_db)):
    new_exercise = exercise_service.create_exercise(db, exercise, TEMP_USER_ID)
    exercise_data = ExerciseResponse.model_validate(new_exercise)
    return created_response(exercise_data)


@router.get(
    "/",
    response_model=APIResponse,
    summary="Get all exercises (global + user-specific)",
    responses={**standard_responses},
)
def get_all_exercises(db: Session = Depends(get_db)):
    exercises = exercise_service.get_all_exercises(db, TEMP_USER_ID)
    exercise_data = [ExerciseResponse.model_validate(e) for e in exercises]
    return success_response(exercise_data)


@router.get(
    "/{exercise_id}",
    response_model=APIResponse,
    summary="Get an exercise by ID",
    responses={**standard_responses},
)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    exercise = exercise_service.get_exercise_by_id(db, exercise_id, TEMP_USER_ID)
    exercise_data = ExerciseResponse.model_validate(exercise)
    return success_response(exercise_data)


@router.put(
    "/{exercise_id}",
    response_model=APIResponse,
    summary="Update exercise details using ID",
    responses={**standard_responses},
)
def update_exercise(exercise_id: int, payload: ExerciseUpdate, db: Session = Depends(get_db)):
    exercise = exercise_service.update_exercise(db, exercise_id, payload, TEMP_USER_ID)
    exercise_data = ExerciseResponse.model_validate(exercise)
    return success_response(exercise_data)


@router.delete(
    "/{exercise_id}",
    response_model=APIResponse,
    summary="Delete an exercise using ID",
    responses={**standard_responses},
)
def delete_exercise(exercise_id: int, db: Session = Depends(get_db)):
    exercise_service.delete_exercise(db, exercise_id, TEMP_USER_ID)
    return success_response()
