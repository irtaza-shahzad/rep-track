"""seed_data

Revision ID: d51ae7b061f3
Revises: 8ac726ce7042
Create Date: 2025-11-19 12:33:28.835434

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone, timedelta
import random

# revision identifiers, used by Alembic.
revision: str = 'd51ae7b061f3'
down_revision: Union[str, Sequence[str], None] = '8ac726ce7042'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Populate database with seed data."""
    
    # Import hashing function
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
    hashed_password = pwd_context.hash("root")
    
    conn = op.get_bind()
    
    # ============================================
    # 1. CREATE USERS (5 users)
    # ============================================
    users_data = [
        {"id": 1, "name": "User One", "email": "user1@gmail.com", "password": hashed_password},
        {"id": 2, "name": "User Two", "email": "user2@gmail.com", "password": hashed_password},
        {"id": 3, "name": "User Three", "email": "user3@gmail.com", "password": hashed_password},
        {"id": 4, "name": "User Four", "email": "user4@gmail.com", "password": hashed_password},
        {"id": 5, "name": "User Five", "email": "user5@gmail.com", "password": hashed_password},
    ]
    
    for user in users_data:
        conn.execute(sa.text("""
            INSERT INTO users (id, name, email, password, created_at)
            VALUES (:id, :name, :email, :password, :created_at)
        """), {"id": user["id"], "name": user["name"], "email": user["email"], 
               "password": user["password"], "created_at": datetime.now(timezone.utc)})
    
    # ============================================
    # 2. CREATE SYSTEM EXERCISES (user_id = NULL)
    # ============================================
    system_exercises = [
        # Chest
        {"id": 1, "name": "Barbell Bench Press", "description": "Classic chest builder", 
         "category": "Strength", "difficulty": "Intermediate", "muscle_group": "Chest", "user_id": None},
        {"id": 2, "name": "Dumbbell Flyes", "description": "Chest isolation", 
         "category": "Strength", "difficulty": "Beginner", "muscle_group": "Chest", "user_id": None},
        {"id": 3, "name": "Push-ups", "description": "Bodyweight chest exercise", 
         "category": "Strength", "difficulty": "Beginner", "muscle_group": "Chest", "user_id": None},
        
        # Back
        {"id": 4, "name": "Deadlift", "description": "Full posterior chain", 
         "category": "Strength", "difficulty": "Advanced", "muscle_group": "Back", "user_id": None},
        {"id": 5, "name": "Pull-ups", "description": "Lat development", 
         "category": "Strength", "difficulty": "Intermediate", "muscle_group": "Back", "user_id": None},
        {"id": 6, "name": "Bent Over Row", "description": "Thick back builder", 
         "category": "Strength", "difficulty": "Intermediate", "muscle_group": "Back", "user_id": None},
        
        # Legs
        {"id": 7, "name": "Barbell Squat", "description": "King of leg exercises", 
         "category": "Strength", "difficulty": "Intermediate", "muscle_group": "Legs", "user_id": None},
        {"id": 8, "name": "Leg Press", "description": "Quad builder", 
         "category": "Strength", "difficulty": "Beginner", "muscle_group": "Legs", "user_id": None},
        {"id": 9, "name": "Romanian Deadlift", "description": "Hamstring focus", 
         "category": "Strength", "difficulty": "Intermediate", "muscle_group": "Legs", "user_id": None},
        {"id": 10, "name": "Leg Curls", "description": "Hamstring isolation", 
         "category": "Strength", "difficulty": "Beginner", "muscle_group": "Legs", "user_id": None},
        
        # Shoulders
        {"id": 11, "name": "Overhead Press", "description": "Shoulder mass builder", 
         "category": "Strength", "difficulty": "Intermediate", "muscle_group": "Shoulders", "user_id": None},
        {"id": 12, "name": "Lateral Raises", "description": "Side delt focus", 
         "category": "Strength", "difficulty": "Beginner", "muscle_group": "Shoulders", "user_id": None},
        
        # Arms
        {"id": 13, "name": "Barbell Curl", "description": "Bicep mass", 
         "category": "Strength", "difficulty": "Beginner", "muscle_group": "Arms", "user_id": None},
        {"id": 14, "name": "Tricep Dips", "description": "Tricep builder", 
         "category": "Strength", "difficulty": "Intermediate", "muscle_group": "Arms", "user_id": None},
        
        # Core
        {"id": 15, "name": "Plank", "description": "Core stability", 
         "category": "Strength", "difficulty": "Beginner", "muscle_group": "Core", "user_id": None},
        {"id": 16, "name": "Ab Wheel Rollout", "description": "Advanced core", 
         "category": "Strength", "difficulty": "Advanced", "muscle_group": "Core", "user_id": None},
        
        # Cardio
        {"id": 17, "name": "Running", "description": "Cardiovascular endurance", 
         "category": "Cardio", "difficulty": "Beginner", "muscle_group": "FullBody", "user_id": None},
        {"id": 18, "name": "Cycling", "description": "Low impact cardio", 
         "category": "Cardio", "difficulty": "Beginner", "muscle_group": "Legs", "user_id": None},
    ]
    
    for ex in system_exercises:
        conn.execute(sa.text("""
            INSERT INTO exercises (id, name, description, category, difficulty, muscle_group, user_id, created_at)
            VALUES (:id, :name, :description, :category, :difficulty, :muscle_group, :user_id, :created_at)
        """), {**ex, "created_at": datetime.now(timezone.utc)})
    
    # ============================================
    # 3. CREATE USER-SPECIFIC EXERCISES (6-7 per user)
    # ============================================
    exercise_id = 19
    user_exercises = {}
    
    custom_exercise_templates = [
        ("Cable Crossover", "Custom chest isolation", "Strength", "Beginner", "Chest"),
        ("Incline Dumbbell Press", "Upper chest focus", "Strength", "Intermediate", "Chest"),
        ("Hammer Curls", "Brachialis focus", "Strength", "Beginner", "Arms"),
        ("Skullcrushers", "Tricep isolation", "Strength", "Intermediate", "Arms"),
        ("Face Pulls", "Rear delt and upper back", "Strength", "Beginner", "Shoulders"),
        ("Calf Raises", "Calf development", "Strength", "Beginner", "Legs"),
        ("Bulgarian Split Squat", "Single leg strength", "Strength", "Intermediate", "Legs"),
    ]
    
    for user_id in range(1, 6):
        user_exercises[user_id] = []
        for i, (name, desc, cat, diff, muscle) in enumerate(custom_exercise_templates):
            ex_name = f"{name} (User {user_id})"
            conn.execute(sa.text("""
                INSERT INTO exercises (id, name, description, category, difficulty, muscle_group, user_id, created_at)
                VALUES (:id, :name, :description, :category, :difficulty, :muscle_group, :user_id, :created_at)
            """), {"id": exercise_id, "name": ex_name, "description": desc, "category": cat,
                   "difficulty": diff, "muscle_group": muscle, "user_id": user_id,
                   "created_at": datetime.now(timezone.utc)})
            user_exercises[user_id].append(exercise_id)
            exercise_id += 1
    
    # ============================================
    # 4. CREATE TEMPLATES (5+ per user)
    # ============================================
    template_id = 1
    template_exercise_id = 1
    user_templates = {}
    
    template_configs = [
        {
            "name": "Push Day",
            "description": "Chest, shoulders, and triceps",
            "exercises": [1, 2, 3, 11, 12, 14],  # Bench, Flyes, Push-ups, OHP, Laterals, Dips
        },
        {
            "name": "Pull Day",
            "description": "Back and biceps",
            "exercises": [4, 5, 6, 13],  # Deadlift, Pull-ups, Rows, Curls
        },
        {
            "name": "Leg Day",
            "description": "Lower body strength",
            "exercises": [7, 8, 9, 10],  # Squat, Leg Press, RDL, Curls
        },
        {
            "name": "Full Body",
            "description": "Complete workout",
            "exercises": [1, 4, 7, 11, 13],  # Bench, Deadlift, Squat, OHP, Curls
        },
        {
            "name": "Core & Cardio",
            "description": "Core strength and conditioning",
            "exercises": [15, 16, 17, 3],  # Plank, Ab Wheel, Running, Push-ups
        },
        {
            "name": "Upper Body Hypertrophy",
            "description": "High volume chest and back",
            "exercises": [1, 2, 5, 6, 11, 14],  # Bench, Flyes, Pull-ups, Rows, OHP, Dips
        },
    ]
    
    for user_id in range(1, 6):
        user_templates[user_id] = []
        for template_config in template_configs:
            # Mix system exercises with user's custom exercises
            exercise_ids = template_config["exercises"].copy()
            # Add 2 random custom exercises for this user
            if user_exercises[user_id]:
                exercise_ids.extend(random.sample(user_exercises[user_id], min(2, len(user_exercises[user_id]))))
            
            conn.execute(sa.text("""
                INSERT INTO workout_templates (id, owner_id, name, description, is_public, created_at)
                VALUES (:id, :owner_id, :name, :description, :is_public, :created_at)
            """), {"id": template_id, "owner_id": user_id, "name": template_config["name"],
                   "description": template_config["description"], "is_public": False,
                   "created_at": datetime.now(timezone.utc)})
            
            # Add exercises to template
            for position, ex_id in enumerate(exercise_ids):
                conn.execute(sa.text("""
                    INSERT INTO template_exercises (id, template_id, exercise_id, position, sets, reps)
                    VALUES (:id, :template_id, :exercise_id, :position, :sets, :reps)
                """), {"id": template_exercise_id, "template_id": template_id, "exercise_id": ex_id,
                       "position": position, "sets": random.randint(3, 5), "reps": random.randint(8, 12)})
                template_exercise_id += 1
            
            user_templates[user_id].append(template_id)
            template_id += 1
    
    # ============================================
    # 5. CREATE WORKOUT HISTORY (for all users)
    # ============================================
    workout_id = 1
    workout_exercise_id = 1
    workout_set_id = 1
    
    # Create 10-15 historical workouts per user
    for user_id in range(1, 6):
        num_workouts = random.randint(10, 15)
        
        for i in range(num_workouts):
            # Random template from user's templates
            template_id_choice = random.choice(user_templates[user_id])
            
            # Workout was done 1-90 days ago
            days_ago = random.randint(1, 90)
            start_time = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(6, 20))
            duration = random.randint(1800, 5400)  # 30-90 minutes
            end_time = start_time + timedelta(seconds=duration)
            
            # Get exercises from this template
            template_exercises_result = conn.execute(sa.text("""
                SELECT exercise_id, sets, reps FROM template_exercises
                WHERE template_id = :template_id ORDER BY position
            """), {"template_id": template_id_choice})
            template_exercises_list = list(template_exercises_result)
            
            # Calculate analytics
            total_volume = 0
            total_sets = 0
            total_reps = 0
            
            # Create workout session
            conn.execute(sa.text("""
                INSERT INTO workout_sessions (id, user_id, template_id, status, start_time, end_time, 
                                              duration_seconds, name, created_at)
                VALUES (:id, :user_id, :template_id, CAST(:status AS workoutstatus), :start_time, :end_time, 
                        :duration_seconds, :name, :created_at)
            """), {"id": workout_id, "user_id": user_id, "template_id": template_id_choice,
                   "status": "COMPLETED", "start_time": start_time, "end_time": end_time,
                   "duration_seconds": duration, "name": None, "created_at": start_time})
            
            # Add exercises and sets
            for position, (exercise_id, planned_sets, planned_reps) in enumerate(template_exercises_list):
                conn.execute(sa.text("""
                    INSERT INTO workout_exercises (id, workout_session_id, exercise_id, position)
                    VALUES (:id, :workout_session_id, :exercise_id, :position)
                """), {"id": workout_exercise_id, "workout_session_id": workout_id,
                       "exercise_id": exercise_id, "position": position})
                
                # Add sets (slightly vary from template)
                num_sets = planned_sets or random.randint(3, 5)
                for set_num in range(1, num_sets + 1):
                    weight = random.uniform(20, 120)  # kg
                    reps = planned_reps or random.randint(8, 12)
                    
                    conn.execute(sa.text("""
                        INSERT INTO workout_sets (id, workout_exercise_id, set_number, weight, reps, is_warmup)
                        VALUES (:id, :workout_exercise_id, :set_number, :weight, :reps, :is_warmup)
                    """), {"id": workout_set_id, "workout_exercise_id": workout_exercise_id,
                           "set_number": set_num, "weight": weight, "reps": reps,
                           "is_warmup": (set_num == 1 and random.random() < 0.3)})  # First set sometimes warmup
                    
                    # Calculate volume
                    if not (set_num == 1 and random.random() < 0.3):  # Don't count warmup
                        total_volume += weight * reps
                        total_sets += 1
                        total_reps += reps
                    
                    workout_set_id += 1
                
                workout_exercise_id += 1
            
            # Update workout analytics
            conn.execute(sa.text("""
                UPDATE workout_sessions
                SET total_volume = :total_volume, total_sets = :total_sets, total_reps = :total_reps
                WHERE id = :id
            """), {"total_volume": total_volume, "total_sets": total_sets, "total_reps": total_reps,
                   "id": workout_id})
            
            workout_id += 1


def downgrade() -> None:
    """Remove all seed data."""
    conn = op.get_bind()
    
    # Delete in reverse order of foreign key dependencies
    conn.execute(sa.text("DELETE FROM workout_sets"))
    conn.execute(sa.text("DELETE FROM workout_exercises"))
    conn.execute(sa.text("DELETE FROM workout_sessions"))
    conn.execute(sa.text("DELETE FROM template_exercises"))
    conn.execute(sa.text("DELETE FROM workout_templates"))
    conn.execute(sa.text("DELETE FROM exercises"))
    conn.execute(sa.text("DELETE FROM users"))
