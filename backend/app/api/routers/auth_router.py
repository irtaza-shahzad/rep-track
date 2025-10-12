from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.services import auth_service
from app.api.schemas.user_schema import UserCreate, UserResponse
from app.api.schemas.auth_schema import LoginRequest
from app.api.common.response_types import created_response, success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    user, token = auth_service.signup_local(db, payload)
    user_data = UserResponse.model_validate(user)
    return created_response({"user": user_data, "access_token": token}, "User created")

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user, token = auth_service.authenticate_local(db, payload.email, payload.password)
    user_data = UserResponse.model_validate(user)
    return success_response({"user": user_data, "access_token": token}, "Login successful")
