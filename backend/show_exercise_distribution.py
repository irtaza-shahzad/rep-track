from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Get a sample of exercises from each muscle group
    result = conn.execute(text("""
        SELECT muscle_group, name, user_id
        FROM exercises
        ORDER BY muscle_group, name
        LIMIT 50
    """)).fetchall()
    
    current_group = None
    print("Exercise Distribution by Muscle Group:\n")
    print("=" * 60)
    
    for row in result:
        muscle_group = row[0]
        if muscle_group != current_group:
            current_group = muscle_group
            print(f"\n{muscle_group}:")
            print("-" * 40)
        
        user_type = "Global" if row[2] is None else f"User {row[2]}"
        print(f"  • {row[1]} ({user_type})")
