from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT id, name, muscle_group, user_id 
        FROM exercises 
        WHERE name LIKE '%Front Squat%' OR name LIKE '%Squat%'
    """)).fetchall()
    
    print("Squat exercises in database:")
    print("=" * 60)
    
    if result:
        for row in result:
            user_type = "Global" if row[3] is None else f"User {row[3]}"
            print(f"ID {row[0]}: {row[1]} -> {row[2]} ({user_type})")
    else:
        print("No squat exercises found")
