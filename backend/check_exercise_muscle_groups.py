from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Check if there are any exercises without muscle_group or with NULL
    result = conn.execute(text("""
        SELECT id, name, muscle_group, user_id 
        FROM exercises 
        WHERE muscle_group IS NULL
    """)).fetchall()
    
    if result:
        print(f"Found {len(result)} exercises without muscle_group:")
        for row in result:
            print(f"  ID: {row[0]}, Name: {row[1]}, User: {row[3]}")
    else:
        print("✅ All exercises have muscle_group assigned!")
    
    print("\n" + "="*60)
    
    # Show distribution of muscle groups
    result = conn.execute(text("""
        SELECT muscle_group, COUNT(*) as count
        FROM exercises
        GROUP BY muscle_group
        ORDER BY count DESC
    """)).fetchall()
    
    print("\nMuscle Group Distribution:")
    for row in result:
        print(f"  {row[0]}: {row[1]} exercises")
    
    print("\n" + "="*60)
    
    # Check if there are any exercises with 'Other' muscle group
    result = conn.execute(text("""
        SELECT id, name, user_id
        FROM exercises
        WHERE muscle_group = 'Other'
        LIMIT 20
    """)).fetchall()
    
    if result:
        print(f"\nFound {len(result)} exercises categorized as 'Other':")
        for row in result:
            user_type = "Global" if row[2] is None else f"User {row[2]}"
            print(f"  {row[1]} ({user_type})")
