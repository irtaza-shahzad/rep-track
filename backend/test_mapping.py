from app.api.services.stats_service import _get_compound_category

exercises = [
    'My Power Bench',
    'Overhead DB Press', 
    'Heavy Goblet Squat',
    'Deficit Deadlift',
    'Weighted Pull-ups',
    'Barbell Bench Press',
    'Incline Dumbbell Bench Press'
]

print("\nExercise mapping test:")
print("="*80)
for ex in exercises:
    mapped = _get_compound_category(ex)
    print(f"  \"{ex}\" -> \"{mapped}\"")
print("="*80)
