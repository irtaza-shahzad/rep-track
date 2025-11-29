from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Get workout exercises with "bench" in the name
result = db.execute(text("""
    SELECT we.exercise_name, ws.weight, ws.reps, ws.completed,
           (CAST(ws.weight AS FLOAT) * (1 + CAST(ws.reps AS FLOAT) / 30.0)) as est_1rm
    FROM workout_exercises we
    JOIN workout_sets ws ON ws.workout_exercise_id = we.id
    JOIN workout_sessions wss ON wss.id = we.workout_session_id
    WHERE wss.user_id = 12 
    AND wss.is_completed = TRUE
    AND we.exercise_name ILIKE '%bench%'
    AND ws.completed = TRUE
    AND CAST(ws.weight AS FLOAT) > 0
    ORDER BY est_1rm DESC
    LIMIT 10
"""))

print("Top 10 Bench Press sets for user4@gmail.com:")
for row in result:
    print(f"  {row[0]}: {row[1]} lbs x {row[2]} reps = {row[4]:.1f} lbs est 1RM")

db.close()
