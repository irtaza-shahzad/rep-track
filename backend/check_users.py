from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

query = text("""
    SELECT u.id, u.email, COUNT(ws.id) as workout_count
    FROM users u
    LEFT JOIN workout_sessions ws ON ws.user_id = u.id AND ws.is_completed = true
    GROUP BY u.id, u.email
    HAVING COUNT(ws.id) > 0
    ORDER BY COUNT(ws.id) DESC
    LIMIT 10
""")

result = db.execute(query)
users = result.fetchall()

print("\nUsers with workout history:\n")
print(f"{'User ID':<10} {'Email':<30} {'Completed Workouts':<20}")
print("-" * 60)
for user in users:
    print(f"{user.id:<10} {user.email:<30} {user.workout_count:<20}")

db.close()
