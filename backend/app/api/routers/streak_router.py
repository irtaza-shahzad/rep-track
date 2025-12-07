from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.schemas.streak_schema import StreakResponse, StreakCreate, StreakUpdate
from app.api.services import streak_service
from app.core.security.dependencies import verify_jwt
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response, created_response
from app.api.common.exception_responses import standard_responses

router = APIRouter(prefix="/api/streak", tags=["Streak"])

@router.post(
    "/start",
    response_model=APIResponse,
    summary="Start a new streak",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def start_streak(data: StreakCreate, db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub"))
    try:
        new_streak = streak_service.start_streak(db, user_id, data.target_days_per_week)
        streak_data = StreakResponse.model_validate(new_streak)
        return created_response(streak_data, "Streak started successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/log_workout",
    response_model=APIResponse,
    summary="Log a workout for the current user",
    responses={**standard_responses},
)
def log_workout(db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub"))
    try:
        updated_streak = streak_service.log_workout(db, user_id)
        streak_data = StreakResponse.model_validate(updated_streak)
        return success_response(streak_data, "Workout logged successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/me",
    response_model=APIResponse,
    summary="Get current user's streak",
    responses={**standard_responses},
)
def get_my_streak(db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub"))
    streak = streak_service.get_streak_by_user_id(db, user_id)
    if not streak:
        # Return null data instead of 404 so frontend can handle "not started" state
        return success_response(None, "No streak started yet")
    streak_data = StreakResponse.model_validate(streak)
    return success_response(streak_data)


@router.put(
    "/update",
    response_model=APIResponse,
    summary="Update target days per week",
    responses={**standard_responses},
)
def update_target_days(data: StreakUpdate, db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub"))
    try:
        updated_streak = streak_service.update_target_days(db, user_id, data.target_days_per_week)
        streak_data = StreakResponse.model_validate(updated_streak)
        return success_response(streak_data, "Target days updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/reset",
    response_model=APIResponse,
    summary="Reset current user's streak to zero",
    responses={**standard_responses},
)
def reset_streak(db: Session = Depends(get_db), payload: dict = Depends(verify_jwt)):
    user_id = int(payload.get("sub"))
    try:
        reset_streak_data = streak_service.reset_streak(db, user_id)
        streak_data = StreakResponse.model_validate(reset_streak_data)
        return success_response(streak_data, "Streak reset successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/leaderboard",
    response_model=APIResponse,
    summary="Get streak leaderboard",
    responses={**standard_responses},
)
def get_streak_leaderboard(db: Session = Depends(get_db), limit: int = 10):
    streaks = streak_service.get_leaderboard(db, limit)
    streak_data = [StreakResponse.model_validate(s) for s in streaks]
    return success_response(streak_data, "Leaderboard retrieved successfully")
