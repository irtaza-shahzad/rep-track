from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.schemas.exercise_schema import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from app.api.services import exercise_service
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response, created_response
from app.api.common.exception_responses import standard_responses
from app.core.security.dependencies import verify_jwt

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])

@router.post(
    "/",
    response_model=APIResponse,
    summary="Create a new exercise",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def create_exercise(exercise: ExerciseCreate, db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub"))
    new_exercise = exercise_service.create_exercise(db, exercise, user_id)
    exercise_data = ExerciseResponse.model_validate(new_exercise)
    return created_response(exercise_data)

@router.get(
    "/",
    response_model=APIResponse,
    summary="Get all exercises (global + user-specific)",
    responses={**standard_responses},
)
def get_all_exercises(db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub", 0))
    exercises = exercise_service.get_all_exercises(db, user_id)
    exercise_data = [ExerciseResponse.model_validate(e) for e in exercises]
    return success_response(exercise_data)

@router.get(
    "/{exercise_id}",
    response_model=APIResponse,
    summary="Get an exercise by ID",
    responses={**standard_responses},
)
def get_exercise(exercise_id: int, db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub", 0))
    exercise = exercise_service.get_exercise_by_id(db, exercise_id, user_id)
    exercise_data = ExerciseResponse.model_validate(exercise)
    return success_response(exercise_data)

@router.get(
    "/by-name/{name}",
    response_model=APIResponse,
    summary="Search exercises by name (partial or full match)",
    responses={**standard_responses},
)
def get_exercises_by_name(name: str, db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub", 0))
    exercises = exercise_service.get_exercises_by_name(db, name, user_id)
    exercise_data = [ExerciseResponse.model_validate(e) for e in exercises]
    return success_response(exercise_data)

@router.get(
    "/by-category/{category}",
    response_model=APIResponse,
    summary="Get exercises by category",
    responses={**standard_responses},
)
def get_exercises_by_category(category: str, db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub", 0))
    exercises = exercise_service.get_exercises_by_category(db, category, user_id)
    exercise_data = [ExerciseResponse.model_validate(e) for e in exercises]
    return success_response(exercise_data)

@router.put(
    "/{exercise_id}",
    response_model=APIResponse,
    summary="Update exercise details using ID",
    responses={**standard_responses},
)
def update_exercise(exercise_id: int, payload: ExerciseUpdate, db: Session = Depends(get_db), token_data: dict = Depends(verify_jwt)):
    user_id = int(token_data.get("sub", 0))
    exercise = exercise_service.update_exercise(db, exercise_id, payload, user_id)
    exercise_data = ExerciseResponse.model_validate(exercise)
    return success_response(exercise_data)

@router.delete(
    "/{exercise_id}",
    response_model=APIResponse,
    summary="Delete an exercise using ID",
    responses={**standard_responses},
)
def delete_exercise(exercise_id: int, db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub", 0))
    exercise_service.delete_exercise(db, exercise_id, user_id)
    return success_response()