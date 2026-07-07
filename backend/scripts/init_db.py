"""
Fresh-clone database setup script.

Run this ONCE after cloning the repo when starting with an empty database:

    cd backend
    python scripts/init_db.py

What it does:
  1. Creates all tables directly from SQLAlchemy models (safe, idempotent)
  2. Stamps Alembic as 'head' so future schema migrations apply correctly

Why not just `alembic upgrade head`?
  The migration history includes seed migrations (test users, workout history)
  that were used during development. Those migrations expect a specific database
  state and will fail on a fresh clone. This script bypasses them by creating
  the schema from the models and bookmarking Alembic at head.
"""
import sys
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, engine  # noqa: E402 — path must be set first

# Register all models on Base.metadata
from app.models.user_model import User  # noqa: F401
from app.models.exercise_model import Exercise  # noqa: F401
from app.models.template_model import WorkoutTemplate  # noqa: F401
from app.models.template_exercise_model import TemplateExercise  # noqa: F401
from app.models.workout_session_model import WorkoutSession  # noqa: F401
from app.models.workout_exercise_model import WorkoutExercise  # noqa: F401
from app.models.workout_set_model import WorkoutSet  # noqa: F401
from app.models.user_stats_model import UserStats, UserStatsTimeseries, WorkoutStatsEvent  # noqa: F401
from app.models.streak_model import Streak  # noqa: F401
from app.models.reminder_model import Reminder  # noqa: F401


def main() -> None:
    print("Creating all tables from SQLAlchemy models...")
    Base.metadata.create_all(bind=engine)
    print("  Done.")

    print("Stamping Alembic version to 'head'...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "stamp", "head"],
        cwd=str(Path(__file__).resolve().parents[1]),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  Warning — alembic stamp failed:\n{result.stderr}")
    else:
        print("  Done.")

    print("\nDatabase setup complete. Start the backend with:")
    print("  uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
