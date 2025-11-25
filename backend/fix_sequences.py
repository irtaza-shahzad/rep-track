"""Fix sequence issues in database"""
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
from sqlalchemy import text

db = SessionLocal()

try:
    # Fix workout_sessions sequence
    result = db.execute(text("""
        SELECT setval('workout_sessions_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM workout_sessions), 
                      false);
    """))
    print("✓ Fixed workout_sessions sequence")
    
    # Fix workout_exercises sequence
    result = db.execute(text("""
        SELECT setval('workout_exercises_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM workout_exercises), 
                      false);
    """))
    print("✓ Fixed workout_exercises sequence")
    
    # Fix workout_sets sequence
    result = db.execute(text("""
        SELECT setval('workout_sets_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM workout_sets), 
                      false);
    """))
    print("✓ Fixed workout_sets sequence")
    
    db.commit()
    print("\n✓ All sequences fixed successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    db.rollback()
finally:
    db.close()
