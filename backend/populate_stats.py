"""
Process all existing completed workouts to populate stats tables.
"""
from app.core.database import SessionLocal
# Import all models to ensure they're registered
from app.models.user_model import User
from app.models.exercise_model import Exercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.user_stats_model import UserStats, UserStatsTimeseries, WorkoutStatsEvent
from app.api.services import stats_service
from sqlalchemy import text

db = SessionLocal()

# Get all users with completed workouts
query = text("""
    SELECT DISTINCT u.id, u.email, COUNT(ws.id) as workout_count
    FROM users u
    JOIN workout_sessions ws ON ws.user_id = u.id
    WHERE ws.is_completed = true
    GROUP BY u.id, u.email
    ORDER BY COUNT(ws.id) DESC
""")

result = db.execute(query)
users = result.fetchall()

print("\n" + "="*80)
print("PROCESSING STATS FOR USERS WITH WORKOUT HISTORY")
print("="*80)

total_users = len(users)
for idx, user in enumerate(users, 1):
    print(f"\n[{idx}/{total_users}] Processing user {user.email} (ID: {user.id})...")
    print(f"   ├─ Workouts to process: {user.workout_count}")
    
    try:
        # Recompute stats for this user
        stats = stats_service.recompute_user(db, user.id)
        
        print(f"   ├─ ✅ Stats computed successfully!")
        print(f"   ├─ Total Workouts: {stats.total_workouts}")
        print(f"   ├─ Total Sets: {stats.total_sets}")
        print(f"   ├─ Total Reps: {stats.total_reps}")
        print(f"   ├─ Total Volume: {stats.total_volume:.2f}")
        print(f"   ├─ Avg Duration: {stats.avg_workout_duration_min:.1f} min")
        print(f"   └─ PRs Tracked: {len(stats.best_one_rep_max_by_exercise or {})}")
        
    except Exception as e:
        print(f"   └─ ❌ Error: {str(e)}")

print("\n" + "="*80)
print("✅ STATS PROCESSING COMPLETE!")
print("="*80)
print(f"\n📊 Processed {total_users} users")
print("\n💡 RECOMMENDED TEST USERS (with most data):")
for user in users[:3]:
    print(f"   • {user.email} - {user.workout_count} workouts")
print("\n" + "="*80 + "\n")

db.close()
