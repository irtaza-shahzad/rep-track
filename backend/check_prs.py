from app.core.database import SessionLocal
from sqlalchemy import text
import json

db = SessionLocal()

result = db.execute(text("""
    SELECT best_one_rep_max_by_exercise 
    FROM user_stats 
    WHERE user_id = 12
"""))
row = result.fetchone()

if row and row[0]:
    prs = row[0]
    print('PRs for user4@gmail.com:')
    for ex, weight in sorted(prs.items(), key=lambda x: x[1], reverse=True):
        print(f'  {ex}: {weight:.1f} lbs')

db.close()
