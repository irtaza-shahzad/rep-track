from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT ws.id, u.email, we.exercise_name, e.muscle_group 
        FROM workout_sessions ws 
        JOIN users u ON u.id = ws.user_id 
        JOIN workout_exercises we ON we.workout_session_id = ws.id 
        LEFT JOIN exercises e ON e.name = we.exercise_name 
            AND (e.user_id = ws.user_id OR e.user_id IS NULL)
        WHERE u.email = 'tahaali@gmail.com'
        ORDER BY ws.id, we.id
    """)).fetchall()
    
    print("Workout exercises for tahaali@gmail.com:")
    print("=" * 60)
    
    for row in result:
        session_id = row[0]
        exercise = row[2]
        muscle_group = row[3]
        print(f"Session {session_id}: {exercise} -> Muscle Group: {muscle_group}")
