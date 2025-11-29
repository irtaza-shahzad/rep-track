from app.core.database import SessionLocal
from sqlalchemy import text

# Compound movement mapping (same as in stats_service.py)
COMPOUND_MOVEMENTS = {
    "Bench Press": ["bench press", "barbell bench", "dumbbell bench", "incline bench", "decline bench"],
    "Squat": ["squat", "back squat", "front squat", "barbell squat"],
    "Deadlift": ["deadlift", "romanian deadlift", "sumo deadlift", "trap bar deadlift"],
    "Overhead Press": ["overhead press", "shoulder press", "military press", "dumbbell shoulder press", "arnold press"],
    "Pull-ups": ["pull-up", "pull up", "pullup", "chin-up", "chin up", "chinup"],
}

def get_compound_category(exercise_name: str) -> str:
    """Map an exercise name to its compound movement category."""
    exercise_lower = exercise_name.lower()
    for category, keywords in COMPOUND_MOVEMENTS.items():
        if any(keyword in exercise_lower for keyword in keywords):
            return category
    return None  # Not a compound movement

db = SessionLocal()

# Get all distinct exercise names from database
result = db.execute(text('SELECT DISTINCT name FROM exercises ORDER BY name'))
all_exercises = [row[0] for row in result]

# Group by compound category
compound_mapping = {}
other_exercises = []

for exercise in all_exercises:
    category = get_compound_category(exercise)
    if category:
        if category not in compound_mapping:
            compound_mapping[category] = []
        compound_mapping[category].append(exercise)
    else:
        other_exercises.append(exercise)

print("=" * 80)
print("EXERCISES THAT UPDATE COMPOUND MOVEMENT PR STATS")
print("=" * 80)
print()

for category in ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Pull-ups"]:
    exercises = compound_mapping.get(category, [])
    print(f"📊 {category.upper()} PR")
    print(f"   Updated by {len(exercises)} exercise(s):")
    if exercises:
        for ex in exercises:
            print(f"      ✓ {ex}")
    else:
        print(f"      ⚠ No exercises found in database")
    print()

print("=" * 80)
print(f"OTHER EXERCISES (tracked individually, not grouped): {len(other_exercises)}")
print("=" * 80)
for ex in other_exercises[:10]:  # Show first 10
    print(f"   • {ex}")
if len(other_exercises) > 10:
    print(f"   ... and {len(other_exercises) - 10} more")

db.close()
