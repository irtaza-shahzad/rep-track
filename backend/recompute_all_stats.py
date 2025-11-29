"""
Script to recompute stats for all users.
This will populate historical PR data in the timeseries table.
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.user_model import User
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.user_stats_model import UserStats, UserStatsTimeseries, WorkoutStatsEvent
from app.api.services.stats_service import recompute_user

def main():
    db = SessionLocal()
    try:
        # Get all users
        users = db.query(User).all()
        print(f"Found {len(users)} users")
        
        for user in users:
            print(f"Recomputing stats for user {user.id} ({user.email})...")
            try:
                recompute_user(db, user.id)
                print(f"  ✓ Successfully recomputed stats for user {user.id}")
            except Exception as e:
                print(f"  ✗ Error recomputing stats for user {user.id}: {e}")
        
        print(f"\n✓ Done! Recomputed stats for {len(users)} users")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
