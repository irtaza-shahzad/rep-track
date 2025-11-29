from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(
        text("SELECT best_one_rep_max_by_exercise FROM user_stats WHERE user_id = (SELECT id FROM users WHERE email = :email)"),
        {'email': 'testuser2years@test.com'}
    )
    row = result.fetchone()
    
    if row and row[0]:
        prs = row[0]
        print("\n" + "="*80)
        print("All PRs in database:")
        print("="*80)
        for k, v in prs.items():
            print(f"  {k}: {v:.1f}")
        
        print("\n" + "="*80)
        print("Compound movements only:")
        print("="*80)
        compound = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Pull-ups"]
        count = 0
        for k, v in prs.items():
            if k in compound:
                print(f"  ✓ {k}: {v:.1f}")
                count += 1
        
        print(f"\nTotal compound movements with PRs: {count}/5")
        print("\nMissing compound movements:")
        for movement in compound:
            if movement not in prs:
                print(f"  ✗ {movement}")
        print("="*80)
