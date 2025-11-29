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

db: Session = next(get_db())

user = db.query(User).filter(User.email == "john.doe@fitness.com").first()
if not user:
    print("User not found")
    exit(1)

# Get all exercises John has done
exercises = db.query(WorkoutExercise).join(WorkoutSession).filter(
    WorkoutSession.user_id == user.id
).all()

exercise_names = set([ex.exercise_name for ex in exercises])

print("All exercises John Doe has done:")
for name in sorted(exercise_names):
    # Check if matches compound keywords
    compound_type = None
    name_lower = name.lower()
    if "bench" in name_lower:
        compound_type = "Bench Press"
    elif "squat" in name_lower:
        compound_type = "Squat"
    elif "deadlift" in name_lower:
        compound_type = "Deadlift"
    elif "overhead" in name_lower or "shoulder press" in name_lower or "military press" in name_lower:
        compound_type = "Overhead Press"
    elif any(x in name_lower for x in ["pull-up", "pull up", "pullup", "chin-up", "chin up", "chinup"]):
        compound_type = "Pull-ups"
    
    if compound_type:
        print(f"  - {name} → {compound_type}")
    else:
        print(f"  - {name}")

print("\n" + "="*80)
print("Checking which compound movements John has NOT done:")
compounds = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Pull-ups"]
done_compounds = set()
for name in exercise_names:
    name_lower = name.lower()
    if "bench" in name_lower:
        done_compounds.add("Bench Press")
    elif "squat" in name_lower:
        done_compounds.add("Squat")
    elif "deadlift" in name_lower:
        done_compounds.add("Deadlift")
    elif "overhead" in name_lower or "shoulder press" in name_lower or "military press" in name_lower:
        done_compounds.add("Overhead Press")
    elif any(x in name_lower for x in ["pull-up", "pull up", "pullup", "chin-up", "chin up", "chinup"]):
        done_compounds.add("Pull-ups")

print(f"Done: {done_compounds}")
missing = set(compounds) - done_compounds
print(f"Missing: {missing}")

db.close()
