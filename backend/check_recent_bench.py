from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Get the most recent bench press sets for tahaali
    result = conn.execute(text("""
        SELECT ws.id, ws.weight, ws.reps, ws.completed, ws.is_warmup, we.exercise_name, wss.id as session_id
        FROM workout_sets ws
        JOIN workout_exercises we ON we.id = ws.workout_exercise_id
        JOIN workout_sessions wss ON wss.id = we.workout_session_id
        WHERE wss.user_id = (SELECT id FROM users WHERE email = 'tahaali@gmail.com')
        AND we.exercise_name LIKE '%Bench%'
        ORDER BY ws.id DESC
        LIMIT 10
    """)).fetchall()
    
    print("Recent Bench Press sets for tahaali@gmail.com:")
    print("=" * 60)
    
    for row in result:
        set_id = row[0]
        weight = row[1]
        reps = row[2]
        completed = "✅" if row[3] else "❌"
        warmup = "🔥 Warmup" if row[4] else ""
        exercise = row[5]
        session_id = row[6]
        
        # Calculate 1RM
        if weight and reps and row[3] and not row[4]:  # completed and not warmup
            try:
                weight_float = float(weight)
                reps_int = int(reps)
                
                if reps_int == 1:
                    est_1rm = weight_float
                else:
                    est_1rm = weight_float * (1 + reps_int / 30.0)
                
                print(f"Set {set_id} (Session {session_id}): {weight} lbs × {reps} reps = {est_1rm:.2f} lbs 1RM {completed} {warmup}")
            except:
                print(f"Set {set_id} (Session {session_id}): {weight} lbs × {reps} reps {completed} {warmup}")
        else:
            print(f"Set {set_id} (Session {session_id}): {weight} lbs × {reps} reps {completed} {warmup}")
