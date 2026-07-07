from fastapi import Response
from app.core.config import settings

ACCESS_TOKEN_COOKIE = "access_token"


def _cookie_params(max_age: int) -> dict:
    if settings.ENVIRONMENT == "production":
        return {
            "httponly": True,
            "secure": True,
            "samesite": "none",
            "max_age": max_age,
            "path": "/",
        }
    return {
        "httponly": True,
        "secure": False,
        "samesite": "lax",
        "max_age": max_age,
        "path": "/",
    }


def set_access_token_cookie(response: Response, token: str) -> None:
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=token,
        **_cookie_params(max_age),
    )


def clear_access_token_cookie(response: Response) -> None:
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        path="/",
        samesite="none" if settings.ENVIRONMENT == "production" else "lax",
        secure=settings.ENVIRONMENT == "production",
    )
