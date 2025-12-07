"""
Check stats for testuser@gmail.com
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.user_model import User
from app.models.user_stats_model import UserStats, UserStatsTimeseries, WorkoutStatsEvent
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.exercise_model import Exercise

def main():
    db = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.email == "testuser@gmail.com").first()
        
        if not user:
            print("❌ User not found!")
            return
        
        print(f"✓ Found user: {user.email} (ID: {user.id})")
        
        # Check completed workouts
        workouts = db.query(WorkoutSession).filter(
            WorkoutSession.user_id == user.id,
            WorkoutSession.is_completed == True
        ).all()
        
        print(f"\n📊 Completed workouts: {len(workouts)}")
        
        for workout in workouts:
            print(f"\n  Workout #{workout.workout_number} (ID: {workout.id})")
            print(f"    - Exercises: {len(workout.workout_exercises)}")
            
            for ex in workout.workout_exercises:
                completed_sets = [s for s in ex.workout_sets if s.completed]
                print(f"      • {ex.exercise_name}: {len(completed_sets)} completed sets")
                
                for s in completed_sets:
                    print(f"        - {s.reps} reps × {s.weight} lbs")
        
        # Check stats
        stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        
        if not stats:
            print("\n❌ No stats record found!")
            return
        
        print(f"\n📈 User Stats:")
        print(f"  Total workouts: {stats.total_workouts}")
        print(f"  Total sets: {stats.total_sets}")
        print(f"  Total volume: {stats.total_volume}")
        print(f"  Best PRs: {stats.best_one_rep_max_by_exercise}")
        print(f"  Muscle groups: {stats.muscle_group_breakdown}")
        
        # Check stats events
        events = db.query(WorkoutStatsEvent).filter(
            WorkoutStatsEvent.user_id == user.id
        ).all()
        
        print(f"\n🔄 Stats events: {len(events)}")
        for event in events:
            status = "✓ Processed" if event.processed else "⏳ Pending"
            print(f"  Event {event.id}: {status} (Workout {event.workout_session_id})")
        
        # Check timeseries
        timeseries = db.query(UserStatsTimeseries).filter(
            UserStatsTimeseries.user_id == user.id
        ).all()
        
        print(f"\n📅 Timeseries records: {len(timeseries)}")
        for ts in timeseries:
            print(f"  {ts.period.value} - {ts.period_start}: {ts.workouts_completed} workouts")
            if ts.best_one_rep_max_by_exercise:
                print(f"    PRs: {ts.best_one_rep_max_by_exercise}")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
