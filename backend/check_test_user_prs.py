from sqlalchemy import create_engine, text
from app.core.config import settings
import json

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(
        text("""
            SELECT best_one_rep_max_by_exercise
            FROM user_stats 
            WHERE user_id = (SELECT id FROM users WHERE email = :email)
        """),
        {'email': 'testuser2years@test.com'}
    )
    row = result.fetchone()
    
    if row and row[0]:
        prs = row[0]
        print("\n" + "="*80)
        print("PRs for testuser2years@test.com")
        print("="*80)
        
        # Sort by PR value descending
        sorted_prs = sorted(prs.items(), key=lambda x: x[1], reverse=True)
        
        for exercise, pr_value in sorted_prs:
            print(f"  {exercise}: {pr_value:.1f} lbs")
        
        print("="*80)
        print(f"\nTotal PRs tracked: {len(prs)}")
        print("="*80 + "\n")
    else:
        print("No stats found for testuser2years@test.com")

