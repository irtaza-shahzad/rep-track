"""Fix all database sequences"""
import sys
sys.path.insert(0, 'D:\\Projects\\Workout Tracking App\\backend')

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

try:
    print("Fixing database sequences...")
    
    # Fix exercises sequence
    db.execute(text("""
        SELECT setval('exercises_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM exercises), 
                      false);
    """))
    print("✓ Fixed exercises sequence")
    
    # Fix users sequence
    db.execute(text("""
        SELECT setval('users_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM users), 
                      false);
    """))
    print("✓ Fixed users sequence")
    
    # Fix workout_templates sequence
    db.execute(text("""
        SELECT setval('workout_templates_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM workout_templates), 
                      false);
    """))
    print("✓ Fixed workout_templates sequence")
    
    # Fix template_exercises sequence
    db.execute(text("""
        SELECT setval('template_exercises_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM template_exercises), 
                      false);
    """))
    print("✓ Fixed template_exercises sequence")
    
    # Fix workout_sessions sequence
    db.execute(text("""
        SELECT setval('workout_sessions_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM workout_sessions), 
                      false);
    """))
    print("✓ Fixed workout_sessions sequence")
    
    # Fix workout_exercises sequence
    db.execute(text("""
        SELECT setval('workout_exercises_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM workout_exercises), 
                      false);
    """))
    print("✓ Fixed workout_exercises sequence")
    
    # Fix workout_sets sequence
    db.execute(text("""
        SELECT setval('workout_sets_id_seq', 
                      (SELECT COALESCE(MAX(id), 0) + 1 FROM workout_sets), 
                      false);
    """))
    print("✓ Fixed workout_sets sequence")
    
    db.commit()
    print("\n✅ All sequences fixed successfully!")
    print("You can now add exercises from the frontend.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
