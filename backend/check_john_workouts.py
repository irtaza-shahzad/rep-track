import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user_model import User
from app.models.user_stats_model import UserStats
from app.models.exercise_model import Exercise
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from datetime import datetime, timezone

db: Session = next(get_db())

user = db.query(User).filter(User.email == "john.doe@fitness.com").first()
if not user:
    print("User not found")
    exit(1)

# Get all workouts sorted by start_time descending
workouts = db.query(WorkoutSession).filter(
    WorkoutSession.user_id == user.id,
    WorkoutSession.is_completed == True
).order_by(WorkoutSession.start_time.desc()).limit(10).all()

print("John Doe's 10 most recent workouts:")
print("="*80)
now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
print(f"Current time (ms): {now_ms}")
print(f"Current time: {datetime.fromtimestamp(now_ms/1000, tz=timezone.utc)}")
print()

for w in workouts:
    # Calculate days ago
    diff_ms = now_ms - w.start_time
    days = diff_ms / (1000 * 60 * 60 * 24)
    workout_dt = datetime.fromtimestamp(w.start_time/1000, tz=timezone.utc)
    
    print(f"Workout #{w.workout_number}: {w.workout_name}")
    print(f"  Start time (ms): {w.start_time}")
    print(f"  Start time (dt): {workout_dt}")
    print(f"  Days ago: {days:.1f}")
    if days < 0:
        print(f"  ⚠️  WARNING: This workout is in the FUTURE!")
    print()

db.close()
