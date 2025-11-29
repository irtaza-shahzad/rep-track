"""
Recompute stats for a specific user after fixing the 1RM formula
"""
from app.core.database import SessionLocal
from app.api.services.stats_service import recompute_user
from sqlalchemy import text

def main():
    db = SessionLocal()
    
    try:
        # Get tahaali user ID
        result = db.execute(text("SELECT id, email FROM users WHERE email = 'tahaali@gmail.com'")).fetchone()
        
        if not result:
            print("User not found!")
            return
        
        user_id = result[0]
        email = result[1]
        
        print(f"Recomputing stats for {email} (ID: {user_id})...")
        print("=" * 60)
        
        # Recompute stats
        recompute_user(db, user_id)
        
        # Check the new PR values
        result = db.execute(text("""
            SELECT best_one_rep_max_by_exercise 
            FROM user_stats 
            WHERE user_id = :user_id
        """), {"user_id": user_id}).fetchone()
        
        print("\n✅ Stats recomputed successfully!")
        print("\nNew PR values:")
        print("=" * 60)
        
        prs = result[0]
        for exercise, weight_lbs in prs.items():
            weight_kg = weight_lbs / 2.20462
            print(f"{exercise}: {weight_lbs:.2f} lbs = {weight_kg:.2f} kg")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
