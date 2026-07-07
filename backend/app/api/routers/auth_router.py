from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.limiter import limiter
from app.api.services import auth_service
from app.api.schemas.user_schema import UserCreate, UserResponse
from app.api.schemas.auth_schema import LoginRequest
from app.api.common.response_types import created_response, success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    user, token = auth_service.signup_local(db, payload)
    user_data = UserResponse.model_validate(user)
    return created_response({"user": user_data, "access_token": token}, "User created")

@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user, token = auth_service.authenticate_local(db, payload.email, payload.password)
    user_data = UserResponse.model_validate(user)
    return success_response({"user": user_data, "access_token": token}, "Login successful")