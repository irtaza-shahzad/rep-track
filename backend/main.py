from fastapi import FastAPI
from app.core.database import Base, engine
from app.api.routers import user_router, auth_router, exercise_router, template_router, streak_router, reminder_router, workout_router
from app.core.open_api import custom_openapi 

# Import models so SQLAlchemy registers them
# Schema is now managed by Alembic migrations, not create_all()
from app.models.user_model import User
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet

# Database schema is managed by Alembic migrations
# Run: alembic upgrade head

app = FastAPI(title="Workout Tracker API")
app.openapi = lambda: custom_openapi(app)

app.include_router(auth_router.router)
app.include_router(exercise_router.router)
app.include_router(user_router.router)
app.include_router(template_router.router)
app.include_router(streak_router.router)
app.include_router(reminder_router.router)
app.include_router(workout_router.router)
