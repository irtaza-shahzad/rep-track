from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Get all distinct exercise names
result = db.execute(text('SELECT DISTINCT name FROM exercises ORDER BY name'))
exercises = [row[0] for row in result]

print("Available exercises:")
for ex in exercises:
    print(f"  - {ex}")

print(f"\nTotal: {len(exercises)} exercises")

db.close()
