from fastapi import status
from typing import Any
from app.api.common.response import make_response

def success_response(data: Any = None, message: str = "Success"):
    return make_response(data, message, status.HTTP_200_OK)

def created_response(data: Any = None, message: str = "Created Successfully"):
    return make_response(data, message, status.HTTP_201_CREATED)

def bad_request_response(message: str = "Invalid Request"):
    return make_response(None, message, status.HTTP_400_BAD_REQUEST)

def unauthorized_response(message: str = "Unauthorized"):
    return make_response(None, message, status.HTTP_401_UNAUTHORIZED)

def not_found_response(message: str = "Resource Not Found"):
    return make_response(None, message, status.HTTP_404_NOT_FOUND)

def internal_error_response(message: str = "Internal Server Error"):
    return make_response(None, message, status.HTTP_500_INTERNAL_SERVER_ERROR)