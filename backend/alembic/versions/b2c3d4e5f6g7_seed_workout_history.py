"""seed_workout_history

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-11-27 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timedelta
import random

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed realistic workout history with progression for all users."""
    
    conn = op.get_bind()
    
    # Get all users
    users_result = conn.execute(sa.text("SELECT id FROM users ORDER BY id"))
    user_ids = [row[0] for row in users_result]
    
    # Get exercises by muscle group
    exercises_result = conn.execute(sa.text("""
        SELECT id, name, muscle_group FROM exercises WHERE user_id IS NULL
    """))
    exercises = [{"id": row[0], "name": row[1], "muscle_group": row[2]} for row in exercises_result]
    
    # Organize exercises by muscle group
    exercises_by_group = {}
    for ex in exercises:
        group = ex["muscle_group"]
        if group not in exercises_by_group:
            exercises_by_group[group] = []
        exercises_by_group[group].append(ex)
    
    print(f"\nGenerating workout history for {len(user_ids)} users...")
    
    # Define workout programs with progression
    workout_templates = [
        {
            "name": "Push Day",
            "exercises": ["Barbell Bench Press", "Dumbbell Shoulder Press", "Incline Barbell Bench Press", 
                         "Lateral Raises", "Cable Tricep Pushdown", "Overhead Tricep Extension"],
            "muscle_groups": ["Chest", "Shoulders", "Arms"]
        },
        {
            "name": "Pull Day",
            "exercises": ["Deadlift", "Pull-ups", "Barbell Row", "Lat Pulldown", "Barbell Curl", "Hammer Curl"],
            "muscle_groups": ["Back", "Arms"]
        },
        {
            "name": "Leg Day",
            "exercises": ["Barbell Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Calf Raises", "Walking Lunges"],
            "muscle_groups": ["Legs"]
        },
        {
            "name": "Upper Body",
            "exercises": ["Barbell Bench Press", "Barbell Row", "Overhead Press", "Lat Pulldown", "Dumbbell Curl", "Cable Tricep Pushdown"],
            "muscle_groups": ["Chest", "Back", "Shoulders", "Arms"]
        },
    ]
    
    # Generate workout history for each user
    for user_id in user_ids:
        # Each user has worked out 15-25 times over the past 60 days
        num_workouts = random.randint(15, 25)
        
        # Create workout dates (not every day, realistic pattern)
        today = datetime.now()
        workout_dates = []
        current_date = today - timedelta(days=60)
        
        while len(workout_dates) < num_workouts:
            # Workout 3-5 times per week
            if random.random() < 0.5:  # 50% chance to workout on any given day
                workout_dates.append(current_date)
            current_date += timedelta(days=1)
            if current_date > today:
                break
        
        workout_dates = sorted(workout_dates[:num_workouts])
        
        # Base strength levels for this user (different for each user)
        base_strength = {
            "Barbell Bench Press": random.randint(135, 225),
            "Barbell Squat": random.randint(185, 315),
            "Deadlift": random.randint(225, 405),
            "Barbell Row": random.randint(95, 185),
            "Overhead Press": random.randint(75, 135),
            "Dumbbell Bench Press": random.randint(50, 90),
            "Dumbbell Shoulder Press": random.randint(35, 65),
            "Barbell Curl": random.randint(50, 95),
        }
        
        print(f"  Generating {num_workouts} workouts for user {user_id}...")
        
        for workout_num, workout_date in enumerate(workout_dates, start=1):
            # Pick a workout template
            template = random.choice(workout_templates)
            
            # Calculate progression (strength increases slightly over time)
            progression_factor = 1.0 + (workout_num / num_workouts) * 0.15  # 15% strength gain over the period
            
            # Calculate workout duration (45-90 minutes)
            duration_seconds = random.randint(2700, 5400)
            
            # Create workout session
            start_time_ms = int(workout_date.timestamp() * 1000)
            end_time_ms = start_time_ms + (duration_seconds * 1000)
            
            workout_result = conn.execute(sa.text("""
                INSERT INTO workout_sessions (
                    user_id, workout_number, workout_name, start_time, end_time,
                    elapsed_seconds, is_active, is_paused, is_completed,
                    created_at, updated_at
                )
                VALUES (
                    :user_id, :workout_number, :workout_name, :start_time, :end_time,
                    :elapsed_seconds, FALSE, FALSE, TRUE,
                    :created_at, :updated_at
                )
                RETURNING id
            """), {
                "user_id": user_id,
                "workout_number": workout_num,
                "workout_name": template["name"],
                "start_time": start_time_ms,
                "end_time": end_time_ms,
                "elapsed_seconds": duration_seconds,
                "created_at": start_time_ms,
                "updated_at": end_time_ms
            })
            
            workout_session_id = workout_result.scalar()
            
            # Add exercises to workout
            total_volume = 0.0
            total_sets = 0
            total_reps = 0
            exercises_count = 0
            
            for position, exercise_name in enumerate(template["exercises"]):
                # Find the exercise
                exercise = next((e for e in exercises if e["name"] == exercise_name), None)
                if not exercise:
                    continue
                
                # Add exercise to workout
                exercise_result = conn.execute(sa.text("""
                    INSERT INTO workout_exercises (workout_session_id, exercise_name, position)
                    VALUES (:workout_session_id, :exercise_name, :position)
                    RETURNING id
                """), {
                    "workout_session_id": workout_session_id,
                    "exercise_name": exercise_name,
                    "position": position
                })
                
                workout_exercise_id = exercise_result.scalar()
                exercises_count += 1
                
                # Determine base weight for this exercise
                if exercise_name in base_strength:
                    base_weight = base_strength[exercise_name] * progression_factor
                else:
                    # Default weights based on exercise type
                    if "Dumbbell" in exercise_name:
                        base_weight = random.randint(25, 60) * progression_factor
                    elif "Cable" in exercise_name or "Lateral" in exercise_name:
                        base_weight = random.randint(20, 50) * progression_factor
                    elif "Bodyweight" in exercise_name or exercise_name in ["Pull-ups", "Push-ups"]:
                        base_weight = 0  # Bodyweight
                    else:
                        base_weight = random.randint(65, 135) * progression_factor
                
                # Add sets (3-5 sets per exercise)
                num_sets = random.randint(3, 5)
                
                for set_position in range(num_sets):
                    # First set is often a warmup
                    is_warmup = (set_position == 0 and random.random() < 0.4)
                    
                    # Calculate weight for this set
                    if is_warmup:
                        weight = base_weight * 0.6  # Warmup at 60%
                        reps = random.randint(10, 12)
                    else:
                        # Progressive overload within workout (weight increases slightly each set)
                        weight_variation = 1.0 + (set_position * 0.025)
                        weight = base_weight * weight_variation
                        
                        # Reps decrease as weight increases
                        if exercise_name in ["Deadlift", "Barbell Squat", "Barbell Bench Press"]:
                            reps = random.randint(5, 8)  # Lower reps for compounds
                        else:
                            reps = random.randint(8, 12)  # Higher reps for accessories
                    
                    # Last set might be a dropset or to failure
                    is_dropset = (set_position == num_sets - 1 and random.random() < 0.2)
                    is_failure = (set_position == num_sets - 1 and random.random() < 0.3)
                    
                    # Calculate RPE (7-10 for working sets)
                    if is_warmup:
                        rpe = random.randint(5, 6)
                    else:
                        rpe = random.randint(7, 10)
                    
                    # All sets are completed (historical data)
                    completed = True
                    completed_at = start_time_ms + (set_position * 180000)  # 3 minutes between sets
                    
                    # Round weight appropriately
                    weight = round(weight / 5) * 5  # Round to nearest 5 lbs/kg
                    
                    # Insert set
                    conn.execute(sa.text("""
                        INSERT INTO workout_sets (
                            workout_exercise_id, position, reps, weight, rpe,
                            completed, completed_at, is_warmup, is_dropset, is_failure
                        )
                        VALUES (
                            :workout_exercise_id, :position, :reps, :weight, :rpe,
                            :completed, :completed_at, :is_warmup, :is_dropset, :is_failure
                        )
                    """), {
                        "workout_exercise_id": workout_exercise_id,
                        "position": set_position,
                        "reps": str(reps),
                        "weight": str(int(weight)) if weight > 0 else "0",
                        "rpe": rpe,
                        "completed": completed,
                        "completed_at": completed_at,
                        "is_warmup": is_warmup,
                        "is_dropset": is_dropset,
                        "is_failure": is_failure
                    })
                    
                    # Update totals (only count non-warmup sets)
                    if not is_warmup:
                        total_volume += weight * reps
                        total_sets += 1
                        total_reps += reps
            
            # Update workout session with analytics
            conn.execute(sa.text("""
                UPDATE workout_sessions
                SET total_volume = :total_volume,
                    total_sets = :total_sets,
                    total_reps = :total_reps,
                    exercises_count = :exercises_count
                WHERE id = :workout_session_id
            """), {
                "workout_session_id": workout_session_id,
                "total_volume": total_volume,
                "total_sets": total_sets,
                "total_reps": total_reps,
                "exercises_count": exercises_count
            })
    
    conn.commit()
    
    print("\n✅ Workout history seeded successfully!")
    print(f"   - Generated {num_workouts * len(user_ids)} total workouts")
    print(f"   - Realistic strength progression over 60 days")
    print(f"   - Varied workout templates (Push/Pull/Legs/Upper)")
    print(f"   - RPE tracking and set variations (warmup/dropset/failure)")


def downgrade() -> None:
    """Remove all workout history."""
    conn = op.get_bind()
    
    conn.execute(sa.text("DELETE FROM workout_sets"))
    conn.execute(sa.text("DELETE FROM workout_exercises"))
    conn.execute(sa.text("DELETE FROM workout_sessions"))
    
    conn.commit()
