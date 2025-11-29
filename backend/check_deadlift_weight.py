from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT ws.weight, ws.reps, we.exercise_name 
        FROM workout_sets ws 
        JOIN workout_exercises we ON we.id = ws.workout_exercise_id 
        JOIN workout_sessions wss ON wss.id = we.workout_session_id 
        WHERE we.exercise_name = 'Deadlift' 
        AND wss.user_id = (SELECT id FROM users WHERE email = 'tahaali@gmail.com') 
        ORDER BY ws.weight DESC 
        LIMIT 5
    """)).fetchall()
    
    print("Deadlift sets for tahaali@gmail.com:")
    print("=" * 60)
    
    for row in result:
        weight = float(row[0]) if row[0] else 0
        reps = int(row[1]) if row[1] else 0
        exercise = row[2]
        
        # Calculate 1RM using Epley formula
        if reps and weight:
            est_1rm = weight * (1 + reps / 30.0)
            print(f"Weight: {weight} lbs, Reps: {reps}, Estimated 1RM: {est_1rm:.2f} lbs")
            
            # Check if it passes the sanity check
            if weight > 1500:
                print(f"  ⚠️  REJECTED: Weight {weight} exceeds 1500 lbs limit")
            else:
                print(f"  ✅  ACCEPTED")
