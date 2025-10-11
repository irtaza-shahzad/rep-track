from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.schemas.user_schema import UserCreate, UserUpdate, UserResponse
from app.api.services import user_service
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response, created_response
from app.api.common.exception_responses import standard_responses
from app.core.security.dependencies import verify_jwt

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get(
    "/",
    dependencies=[Depends(verify_jwt)],
    response_model=APIResponse,
    summary="Get all users",
    responses={**standard_responses},
)
def get_all_users(db: Session = Depends(get_db)):
    users = user_service.get_all_users(db)
    user_data = [UserResponse.model_validate(u) for u in users]
    return success_response(user_data)

@router.get(
    "/{user_id}",
    dependencies=[Depends(verify_jwt)],
    response_model=APIResponse,
    summary="Get a user by user ID",
    responses={**standard_responses},
)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = user_service.get_user_by_id(db, user_id)
    user_data = UserResponse.model_validate(user)
    return success_response(user_data)

@router.put(
    "/{user_id}",
    dependencies=[Depends(verify_jwt)],
    response_model=APIResponse,
    summary="Update user details using user ID",
    responses={**standard_responses},
)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = user_service.update_user(db, user_id, payload)
    user_data = UserResponse.model_validate(user)
    return success_response(user_data)

@router.delete(
    "/{user_id}",
    dependencies=[Depends(verify_jwt)],
    response_model=APIResponse,
    summary="Delete a user using user ID",
    responses={**standard_responses},
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user_service.delete_user(db, user_id)
    return success_response()