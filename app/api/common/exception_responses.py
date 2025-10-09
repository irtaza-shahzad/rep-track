standard_responses = {
    400: {
        "description": "Bad Request",
        "content": {"application/json": {"example": {"detail": "Invalid request"}}},
    },
    401: {
        "description": "Unauthorized",
        "content": {"application/json": {"example": {"detail": "Unauthorized"}}},
    },
    404: {
        "description": "Not Found",
        "content": {"application/json": {"example": {"detail": "Resource not found"}}},
    },
    500: {
        "description": "Internal Server Error",
        "content": {"application/json": {"example": {"detail": "Internal server error"}}},
    },
}
