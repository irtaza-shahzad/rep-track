from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.schemas.user_schema import UserUpdate, UserResponse
from app.api.services import user_service
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response
from app.api.common.exception_responses import standard_responses
from app.api.services.auth_service import get_current_user
from app.models.user_model import User

router = APIRouter(prefix="/api/users", tags=["Users"])


def _ensure_self(current_user: User, user_id: int) -> None:
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own account",
        )


@router.get(
    "/me",
    response_model=APIResponse,
    summary="Get current user profile",
    responses={**standard_responses},
)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    user_data = UserResponse.model_validate(current_user)
    return success_response(user_data)


@router.get(
    "/{user_id}",
    response_model=APIResponse,
    summary="Get a user by user ID",
    responses={**standard_responses},
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_self(current_user, user_id)
    user = user_service.get_user_by_id(db, user_id)
    user_data = UserResponse.model_validate(user)
    return success_response(user_data)


@router.put(
    "/{user_id}",
    response_model=APIResponse,
    summary="Update user details using user ID",
    responses={**standard_responses},
)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_self(current_user, user_id)
    user = user_service.update_user(db, user_id, payload)
    user_data = UserResponse.model_validate(user)
    return success_response(user_data)


@router.delete(
    "/{user_id}",
    response_model=APIResponse,
    summary="Delete a user using user ID",
    responses={**standard_responses},
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_self(current_user, user_id)
    user_service.delete_user(db, user_id)
    return success_response()
