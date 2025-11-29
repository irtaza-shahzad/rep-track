from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT u.email, us.total_sets, us.muscle_group_breakdown 
        FROM user_stats us 
        JOIN users u ON u.id = us.user_id 
        WHERE u.email = 'tahaali@gmail.com'
    """)).fetchone()
    
    if result:
        print(f"Email: {result[0]}")
        print(f"Total Sets: {result[1]}")
        print(f"Muscle Groups: {result[2]}")
    else:
        print("No stats found for tahaali@gmail.com")
