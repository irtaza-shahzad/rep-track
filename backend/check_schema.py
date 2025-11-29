from app.core.database import engine
import sqlalchemy as sa

inspector = sa.inspect(engine)

print("\n=== WORKOUT_SESSIONS TABLE SCHEMA ===")
cols = inspector.get_columns('workout_sessions')
for col in cols:
    print(f"  {col['name']}: {col['type']} (nullable={col['nullable']})")

print("\n=== WORKOUT_EXERCISES TABLE SCHEMA ===")
cols = inspector.get_columns('workout_exercises')
for col in cols:
    print(f"  {col['name']}: {col['type']} (nullable={col['nullable']})")

print("\n=== WORKOUT_SETS TABLE SCHEMA ===")
cols = inspector.get_columns('workout_sets')
for col in cols:
    print(f"  {col['name']}: {col['type']} (nullable={col['nullable']})")

print("\n=== INDEXES ===")
indexes = inspector.get_indexes('workout_sessions')
for idx in indexes:
    print(f"  workout_sessions: {idx['name']} on {idx['column_names']}")
