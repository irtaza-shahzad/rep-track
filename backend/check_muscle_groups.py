import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user_model import User
from app.models.user_stats_model import UserStats

db: Session = next(get_db())

# Check the new user tahaali@gmail.com
user = db.query(User).filter(User.email == "tahaali@gmail.com").first()
if not user:
    print("User not found")
    exit(1)

stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()

print(f"User: {user.email}")
print(f"Total Workouts: {stats.total_workouts}")
print(f"Total Sets: {stats.total_sets}")
print(f"\nMuscle Group Breakdown:")
if stats.muscle_group_breakdown:
    for muscle_group, sets in stats.muscle_group_breakdown.items():
        print(f"  {muscle_group}: {sets} sets")
else:
    print("  No data")

db.close()
