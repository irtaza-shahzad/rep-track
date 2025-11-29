"""seed_data_complete

Revision ID: a1b2c3d4e5f6
Revises: 9f5747959ed3
Create Date: 2025-11-27 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9f5747959ed3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    """Seed the database with users, exercises, and templates."""
    
    # Get connection
    conn = op.get_bind()
    
    # Hash the password 'root' for all users
    hashed_password = pwd_context.hash("root")
    created_at = datetime.now(timezone.utc)
    
    # ===== CREATE 8 USERS =====
    print("Creating 8 users...")
    users = []
    for i in range(1, 9):
        result = conn.execute(sa.text("""
            INSERT INTO users (name, email, password, created_at)
            VALUES (:name, :email, :password, :created_at)
            RETURNING id
        """), {
            "name": f"User {i}",
            "email": f"user{i}@gmail.com",
            "password": hashed_password,
            "created_at": created_at
        })
        user_id = result.scalar()
        users.append(user_id)
        print(f"  Created user{i}@gmail.com (ID: {user_id})")
    
    # ===== CREATE SYSTEM EXERCISES (user_id = NULL) =====
    print("\nCreating system exercises...")
    system_exercises = [
        # CHEST exercises
        {"name": "Barbell Bench Press", "muscle_group": "Chest", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Dumbbell Bench Press", "muscle_group": "Chest", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Incline Barbell Bench Press", "muscle_group": "Chest", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Decline Dumbbell Press", "muscle_group": "Chest", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Push-ups", "muscle_group": "Chest", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Cable Chest Fly", "muscle_group": "Chest", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Chest Dips", "muscle_group": "Chest", "category": "Strength", "difficulty": "Intermediate"},
        
        # BACK exercises
        {"name": "Deadlift", "muscle_group": "Back", "category": "Strength", "difficulty": "Advanced"},
        {"name": "Pull-ups", "muscle_group": "Back", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Barbell Row", "muscle_group": "Back", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Lat Pulldown", "muscle_group": "Back", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Seated Cable Row", "muscle_group": "Back", "category": "Strength", "difficulty": "Beginner"},
        {"name": "T-Bar Row", "muscle_group": "Back", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Single-Arm Dumbbell Row", "muscle_group": "Back", "category": "Strength", "difficulty": "Beginner"},
        
        # SHOULDERS exercises
        {"name": "Overhead Press", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Dumbbell Shoulder Press", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Lateral Raises", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Front Raises", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Rear Delt Fly", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Arnold Press", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Face Pulls", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
        
        # LEGS exercises
        {"name": "Barbell Squat", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Leg Press", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Romanian Deadlift", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Leg Curl", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Leg Extension", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Bulgarian Split Squat", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Walking Lunges", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Calf Raises", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
        
        # ARMS exercises
        {"name": "Barbell Curl", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Dumbbell Curl", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Hammer Curl", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Tricep Dips", "muscle_group": "Arms", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Overhead Tricep Extension", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Cable Tricep Pushdown", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Skull Crushers", "muscle_group": "Arms", "category": "Strength", "difficulty": "Intermediate"},
        
        # CORE exercises
        {"name": "Plank", "muscle_group": "Core", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Crunches", "muscle_group": "Core", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Russian Twists", "muscle_group": "Core", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Hanging Leg Raises", "muscle_group": "Core", "category": "Strength", "difficulty": "Advanced"},
        {"name": "Cable Woodchops", "muscle_group": "Core", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Ab Wheel Rollout", "muscle_group": "Core", "category": "Strength", "difficulty": "Advanced"},
        
        # CARDIO exercises
        {"name": "Running", "muscle_group": "Other", "category": "Cardio", "difficulty": "Beginner"},
        {"name": "Cycling", "muscle_group": "Other", "category": "Cardio", "difficulty": "Beginner"},
        {"name": "Rowing Machine", "muscle_group": "Other", "category": "Cardio", "difficulty": "Beginner"},
        {"name": "Jump Rope", "muscle_group": "Other", "category": "Cardio", "difficulty": "Beginner"},
        {"name": "Stair Climber", "muscle_group": "Other", "category": "Cardio", "difficulty": "Beginner"},
    ]
    
    exercise_ids = {}
    for ex in system_exercises:
        result = conn.execute(sa.text("""
            INSERT INTO exercises (user_id, name, muscle_group, category, difficulty, created_at)
            VALUES (NULL, :name, :muscle_group, :category, :difficulty, :created_at)
            RETURNING id
        """), {**ex, "created_at": created_at})
        ex_id = result.scalar()
        exercise_ids[ex["name"]] = ex_id
    
    print(f"  Created {len(system_exercises)} system exercises")
    
    # ===== CREATE CUSTOM EXERCISES FOR EACH USER =====
    print("\nCreating custom exercises for users...")
    custom_exercises_per_user = [
        {"name": "My Special Bench Press Variation", "muscle_group": "Chest", "category": "Strength", "difficulty": "Intermediate"},
        {"name": "Custom Cable Exercise", "muscle_group": "Back", "category": "Strength", "difficulty": "Beginner"},
        {"name": "Unique Shoulder Movement", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
    ]
    
    for user_id in users:
        for custom_ex in custom_exercises_per_user:
            conn.execute(sa.text("""
                INSERT INTO exercises (user_id, name, muscle_group, category, difficulty, created_at)
                VALUES (:user_id, :name, :muscle_group, :category, :difficulty, :created_at)
            """), {**custom_ex, "user_id": user_id, "created_at": created_at})
    
    print(f"  Created {len(custom_exercises_per_user)} custom exercises for each of {len(users)} users")
    
    # ===== CREATE TEMPLATES FOR USERS =====
    print("\nCreating workout templates...")
    
    # Template definitions
    templates_data = [
        {
            "name": "Push Day",
            "description": "Chest, Shoulders, and Triceps workout",
            "exercises": ["Barbell Bench Press", "Dumbbell Shoulder Press", "Incline Barbell Bench Press", 
                         "Lateral Raises", "Cable Tricep Pushdown", "Overhead Tricep Extension"]
        },
        {
            "name": "Pull Day",
            "description": "Back and Biceps workout",
            "exercises": ["Deadlift", "Pull-ups", "Barbell Row", "Lat Pulldown", "Barbell Curl", "Hammer Curl"]
        },
        {
            "name": "Leg Day",
            "description": "Complete lower body workout",
            "exercises": ["Barbell Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raises", "Walking Lunges"]
        },
        {
            "name": "Upper Body",
            "description": "Full upper body strength",
            "exercises": ["Barbell Bench Press", "Barbell Row", "Overhead Press", "Pull-ups", "Dumbbell Curl", "Tricep Dips"]
        },
        {
            "name": "Full Body",
            "description": "Complete full body workout",
            "exercises": ["Barbell Squat", "Barbell Bench Press", "Deadlift", "Overhead Press", "Pull-ups", "Plank"]
        },
    ]
    
    # Create templates for each user
    for user_id in users[:6]:  # First 6 users get templates
        for template_data in templates_data:
            # Insert template
            result = conn.execute(sa.text("""
                INSERT INTO workout_templates (owner_id, name, description, is_public, created_at)
                VALUES (:owner_id, :name, :description, FALSE, :created_at)
                RETURNING id
            """), {
                "owner_id": user_id,
                "name": template_data["name"],
                "description": template_data["description"],
                "created_at": created_at
            })
            template_id = result.scalar()
            
            # Add exercises to template
            for position, exercise_name in enumerate(template_data["exercises"]):
                if exercise_name in exercise_ids:
                    conn.execute(sa.text("""
                        INSERT INTO template_exercises (template_id, exercise_id, position, sets, reps, rest_seconds)
                        VALUES (:template_id, :exercise_id, :position, :sets, :reps, :rest_seconds)
                    """), {
                        "template_id": template_id,
                        "exercise_id": exercise_ids[exercise_name],
                        "position": position,
                        "sets": 3,
                        "reps": 10,
                        "rest_seconds": 60
                    })
    
    print(f"  Created {len(templates_data)} templates for {6} users")
    
    print("\n✅ Database seeded successfully!")
    print(f"   - 8 users (user1@gmail.com through user8@gmail.com, password: root)")
    print(f"   - {len(system_exercises)} system exercises")
    print(f"   - {len(custom_exercises_per_user) * len(users)} custom exercises")
    print(f"   - {len(templates_data) * 6} templates")


def downgrade() -> None:
    """Remove all seeded data."""
    conn = op.get_bind()
    
    # Delete in reverse order of dependencies
    conn.execute(sa.text("DELETE FROM template_exercises"))
    conn.execute(sa.text("DELETE FROM workout_templates"))
    conn.execute(sa.text("DELETE FROM exercises"))
    conn.execute(sa.text("DELETE FROM users"))
