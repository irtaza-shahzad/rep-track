"""Debug user_id comparison"""
import sys
sys.path.insert(0, 'D:\\Projects\\Workout Tracking App\\backend')

# Import all models
from app.models.user_model import User
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet

from app.core.database import SessionLocal

db = SessionLocal()

try:
    # Get workout 66
    session = db.query(WorkoutSession).filter(WorkoutSession.id == 66).first()
    if session:
        print(f"Workout 66 found:")
        print(f"  user_id: {session.user_id}")
        print(f"  user_id type: {type(session.user_id)}")
        print(f"  status: {session.status}")
        
        # Test comparison
        user_id_from_jwt = 1  # This is int
        user_id_from_jwt_str = "1"  # This is string from JWT
        
        print(f"\nComparison tests:")
        print(f"  session.user_id == 1 (int): {session.user_id == user_id_from_jwt}")
        print(f"  session.user_id == '1' (str): {session.user_id == user_id_from_jwt_str}")
        print(f"  session.user_id != 1 (int): {session.user_id != user_id_from_jwt}")
        print(f"  session.user_id != '1' (str): {session.user_id != user_id_from_jwt_str}")
    else:
        print("Workout 66 not found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
