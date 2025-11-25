"""Check exercise and user data"""
import sys
sys.path.insert(0, 'D:\\Projects\\Workout Tracking App\\backend')

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

try:
    # Check Yabardoo exercise
    result = db.execute(text("SELECT id, name, user_id FROM exercises WHERE name = 'Yabardoo'")).fetchone()
    if result:
        print(f"Exercise: {result[1]}, user_id: {result[2]}")
    else:
        print("Yabardoo exercise not found")
    
    # Check all users
    users = db.execute(text("SELECT id, email FROM users")).fetchall()
    print("\nUsers:")
    for user in users:
        print(f"  ID: {user[0]}, Email: {user[1]}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
