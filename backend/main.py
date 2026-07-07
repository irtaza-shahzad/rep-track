from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.api.routers import (
    user_router, 
    auth_router, 
    exercise_router, 
    template_router, 
    active_workout_router, 
    stats_router, 
    streak_router, 
    reminder_router,
    export_router
)
from app.core.open_api import custom_openapi
from app.core.config import settings
from app.core.limiter import limiter

# Import models so SQLAlchemy registers them
from app.models.user_model import User
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.user_stats_model import UserStats, UserStatsTimeseries, WorkoutStatsEvent
from app.models.streak_model import Streak
from app.models.reminder_model import Reminder

docs_url = None if settings.is_production else "/docs"
redoc_url = None if settings.is_production else "/redoc"
openapi_url = None if settings.is_production else "/openapi.json"

app = FastAPI(
    title="Workout Tracker API",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)
app.openapi = lambda: custom_openapi(app)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS — origins are controlled via ALLOWED_ORIGINS in .env
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(exercise_router.router)
app.include_router(user_router.router)
app.include_router(template_router.router)
app.include_router(active_workout_router.router)
app.include_router(stats_router.router)
app.include_router(streak_router.router)
app.include_router(reminder_router.router)
app.include_router(export_router.router)