"""Direct test of workout service"""
import sys
sys.path.insert(0, 'D:\\Projects\\Workout Tracking App\\backend')

# Import all models to ensure SQLAlchemy registers them
from app.models.user_model import User
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet

from app.core.database import SessionLocal
from app.api.services.workout_service import start_workout_session, get_active_workout
from app.api.schemas.workout_schema import WorkoutSessionStart

# Create a test
db = SessionLocal()

try:
    # Test user ID 1
    user_id = 1
    
    # Check for existing active workout
    print("Checking for active workout...")
    active = get_active_workout(db, user_id)
    if active:
        print(f"Found active workout: {active.id}")
    else:
        print("No active workout found")
    
    # Try to start a workout
    print("\nStarting new workout...")
    data = WorkoutSessionStart(name="Test Workout")
    session = start_workout_session(db, user_id, data)
    print(f"✓ Workout started successfully! ID: {session.id}")
    print(f"Name: {session.name}")
    print(f"Status: {session.status}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
