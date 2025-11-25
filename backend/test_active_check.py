"""Test active workout check directly"""
import sys
sys.path.insert(0, 'D:\\Projects\\Workout Tracking App\\backend')

# Import all models
from app.models.user_model import User
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession, WorkoutStatus
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet

from app.core.database import SessionLocal

db = SessionLocal()

try:
    user_id = 1
    
    # Check active workout like the service does
    print(f"Checking for active workout for user {user_id}...")
    active_workout = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.status == WorkoutStatus.ACTIVE
    ).all()
    
    print(f"Found {len(active_workout)} active workout(s)")
    for workout in active_workout:
        print(f"  - ID: {workout.id}, Name: {workout.name}, Status: {workout.status}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
