from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security.cookies import set_access_token_cookie, clear_access_token_cookie
from app.api.services import auth_service
from app.api.services.auth_service import get_current_user
from app.api.schemas.user_schema import UserCreate, UserResponse
from app.api.schemas.auth_schema import LoginRequest
from app.api.common.response_types import created_response, success_response
from app.models.user_model import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    user, _token = auth_service.signup_local(db, payload)
    user_data = UserResponse.model_validate(user)
    return created_response({"user": user_data}, "User created")


@router.post("/login")
@limiter.limit("10/minute")
def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user, token = auth_service.authenticate_local(db, payload.email, payload.password)
    user_data = UserResponse.model_validate(user)
    set_access_token_cookie(response, token)
    return success_response({"user": user_data}, "Login successful")


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    user_data = UserResponse.model_validate(current_user)
    return success_response(user_data, "Authenticated")


@router.post("/logout")
def logout(response: Response):
    clear_access_token_cookie(response)
    return success_response(message="Logged out")
