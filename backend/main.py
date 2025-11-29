from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import user_router, auth_router, exercise_router, template_router, active_workout_router, stats_router
from app.core.open_api import custom_openapi 

# Import models so SQLAlchemy registers them
from app.models.user_model import User
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.user_stats_model import UserStats, UserStatsTimeseries, WorkoutStatsEvent

app = FastAPI(title="Workout Tracker API")
app.openapi = lambda: custom_openapi(app)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],  # Frontend URLs
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