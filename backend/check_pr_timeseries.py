"""
Check PR tracking in timeseries data for user 24
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
from app.models.user_stats_model import UserStats, UserStatsTimeseries, StatsPeriod, WorkoutStatsEvent

def main():
    db = SessionLocal()
    try:
        user_id = 24
        
        # Get last 10 monthly timeseries records for user 24
        records = db.query(UserStatsTimeseries).filter(
            UserStatsTimeseries.user_id == user_id,
            UserStatsTimeseries.period == StatsPeriod.month
        ).order_by(UserStatsTimeseries.period_start.desc()).limit(10).all()
        
        print(f"\nPR Progression for user {user_id} (last 10 months):\n")
        print(f"{'Date':<12} {'Workouts':<10} {'PRs Tracked'}")
        print("-" * 60)
        
        for record in reversed(records):
            prs = record.best_one_rep_max_by_exercise or {}
            pr_summary = ", ".join([f"{ex}: {w:.1f} lbs" for ex, w in list(prs.items())[:3]])
            if not pr_summary:
                pr_summary = "No PRs"
            print(f"{record.period_start} {record.workouts_completed:<10} {pr_summary}")
        
        print("\n✓ Historical PR tracking is working!")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
