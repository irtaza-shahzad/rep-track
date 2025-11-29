from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Check recent stats events
    result = conn.execute(text("""
        SELECT id, user_id, workout_session_id, processed, created_at 
        FROM workout_stats_event 
        ORDER BY id DESC 
        LIMIT 10
    """)).fetchall()
    
    print("Recent stats events:")
    print("=" * 60)
    
    if result:
        for row in result:
            status = "✅ Processed" if row[3] else "⏳ Pending"
            print(f"ID: {row[0]}, User: {row[1]}, Session: {row[2]}, {status}")
    else:
        print("No stats events found!")
    
    # Check the most recent workout for tahaali
    print("\n" + "=" * 60)
    result = conn.execute(text("""
        SELECT ws.id, ws.completed_at, ws.is_completed, we.exercise_name, COUNT(wset.id) as sets
        FROM workout_sessions ws
        JOIN workout_exercises we ON we.workout_session_id = ws.id
        LEFT JOIN workout_sets wset ON wset.workout_exercise_id = we.id AND wset.completed = true
        WHERE ws.user_id = (SELECT id FROM users WHERE email = 'tahaali@gmail.com')
        GROUP BY ws.id, ws.completed_at, ws.is_completed, we.exercise_name
        ORDER BY ws.id DESC
        LIMIT 10
    """)).fetchall()
    
    print("\nRecent workouts for tahaali@gmail.com:")
    print("=" * 60)
    
    for row in result:
        completed = "✅ Completed" if row[2] else "⏳ Active"
        print(f"Session {row[0]}: {row[3]} ({row[4]} sets) - {completed}")
