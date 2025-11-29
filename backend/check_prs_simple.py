"""
Simple stats recomputation without model dependencies
"""
from sqlalchemy import create_engine, text
from app.core.config import settings
import requests

# Get token first
email = "tahaali@gmail.com"
password = "test123"  # You'll need to provide the actual password

def main():
    engine = create_engine(settings.DATABASE_URL)
    
    print("Checking current PR values BEFORE recomputation:")
    print("=" * 60)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT best_one_rep_max_by_exercise 
            FROM user_stats 
            WHERE user_id = (SELECT id FROM users WHERE email = 'tahaali@gmail.com')
        """)).fetchone()
        
        print("\nCurrent PRs:")
        for exercise, weight_lbs in result[0].items():
            weight_kg = weight_lbs / 2.20462
            print(f"  {exercise}: {weight_lbs:.2f} lbs = {weight_kg:.2f} kg")
    
    print("\n" + "=" * 60)
    print("To recompute stats with the fixed formula:")
    print("1. Login to your account in the app")
    print("2. Go to Stats page")
    print("3. The stats will automatically recompute on next workout")
    print("\nOr call the recompute API endpoint:")
    print("  POST /api/stats/recompute")
    print("=" * 60)

if __name__ == "__main__":
    main()
