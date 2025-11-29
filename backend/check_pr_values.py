from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT best_one_rep_max_by_exercise 
        FROM user_stats 
        WHERE user_id = (SELECT id FROM users WHERE email = 'tahaali@gmail.com')
    """)).fetchone()
    
    print("PR data for tahaali@gmail.com:")
    print("=" * 60)
    print(result[0])
    
    # Convert to kg for display
    print("\nConverted to kg (divide by 2.20462):")
    for exercise, weight_lbs in result[0].items():
        weight_kg = weight_lbs / 2.20462
        print(f"{exercise}: {weight_lbs:.2f} lbs = {weight_kg:.2f} kg")
