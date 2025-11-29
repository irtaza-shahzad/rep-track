"""seed_test_user_with_2_years_data

Revision ID: 0b63a357dd4d
Revises: c0a1_stats_tables
Create Date: 2025-11-29 14:36:56.203332

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timedelta
import random
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision: str = '0b63a357dd4d'
down_revision: Union[str, Sequence[str], None] = 'c0a1_stats_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    """Create test user with 2 years of workout data."""
    
    conn = op.get_bind()
    
    # Create test user: testuser2years@test.com / Password123
    hashed_password = pwd_context.hash("Password123")
    result = conn.execute(
        sa.text("""
            INSERT INTO users (email, name, password, created_at)
            VALUES (:email, :name, :password, :created_at)
            RETURNING id
        """),
        {
            "email": "testuser2years@test.com",
            "name": "Test User 2 Years",
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }
    )
    user_id = result.fetchone()[0]
    print(f"✓ Created test user (ID: {user_id}): testuser2years@test.com")
    
    # Create custom exercises for this user
    custom_exercises = [
        ("My Power Bench", "Chest", "Strength", "Intermediate", "Custom bench press variation with bands"),
        ("Heavy Goblet Squat", "Legs", "Strength", "Intermediate", "Deep squats holding heavy dumbbell"),
        ("Deficit Deadlift", "Legs", "Strength", "Advanced", "Deadlifts standing on elevated platform"),
        ("Overhead DB Press", "Shoulders", "Strength", "Intermediate", "Standing dumbbell shoulder press"),
        ("Weighted Pull-ups", "Back", "Strength", "Advanced", "Pull-ups with weight belt"),
        ("Core Circuit", "Core", "Strength", "Intermediate", "Combination of core exercises"),
    ]
    
    exercise_ids = {}
    for name, muscle, category, difficulty, desc in custom_exercises:
        result = conn.execute(
            sa.text("""
                INSERT INTO exercises (name, muscle_group, category, difficulty, description, user_id, created_at)
                VALUES (:name, :muscle_group, :category, :difficulty, :desc, :user_id, :created_at)
                RETURNING id
            """),
            {
                "name": name,
                "muscle_group": muscle,
                "category": category,
                "difficulty": difficulty,
                "desc": desc,
                "user_id": user_id,
                "created_at": datetime.utcnow()
            }
        )
        exercise_ids[name] = result.fetchone()[0]
    
    print(f"✓ Created {len(custom_exercises)} custom exercises")
    
    # Get some existing exercises from the database
    existing_exercises = conn.execute(
        sa.text("SELECT id, name FROM exercises WHERE user_id IS NULL ORDER BY name LIMIT 20")
    ).fetchall()
    for ex_id, ex_name in existing_exercises:
        exercise_ids[ex_name] = ex_id
    
    # Create workout templates
    templates = [
        {
            "name": "Upper Body Power",
            "exercises": ["My Power Bench", "Barbell Row", "Overhead DB Press", "Barbell Curl", "Cable Tricep Pushdown"]
        },
        {
            "name": "Lower Body Strength",
            "exercises": ["Heavy Goblet Squat", "Deficit Deadlift", "Leg Press", "Leg Curl", "Calf Raises"]
        },
        {
            "name": "Pull Day",
            "exercises": ["Weighted Pull-ups", "Barbell Row", "Lat Pulldown", "Barbell Curl", "Hammer Curl"]
        },
        {
            "name": "Full Body",
            "exercises": ["My Power Bench", "Heavy Goblet Squat", "Weighted Pull-ups", "Overhead DB Press", "Core Circuit"]
        }
    ]
    
    template_exercise_map = {}
    for template in templates:
        result = conn.execute(
            sa.text("""
                INSERT INTO workout_templates (name, owner_id, is_public, created_at)
                VALUES (:name, :owner_id, FALSE, :created_at)
                RETURNING id
            """),
            {
                "name": template["name"],
                "owner_id": user_id,
                "created_at": datetime.utcnow()
            }
        )
        template_id = result.fetchone()[0]
        template_exercise_map[template["name"]] = []
        
        for position, ex_name in enumerate(template["exercises"]):
            if ex_name in exercise_ids:
                conn.execute(
                    sa.text("""
                        INSERT INTO template_exercises (template_id, exercise_id, position)
                        VALUES (:template_id, :exercise_id, :position)
                    """),
                    {
                        "template_id": template_id,
                        "exercise_id": exercise_ids[ex_name],
                        "position": position
                    }
                )
                template_exercise_map[template["name"]].append(ex_name)
    
    print(f"✓ Created {len(templates)} workout templates")
    
    # Generate 2 years of workout data (730 days)
    # Workout 4-5 times per week with progressive overload
    end_date = datetime.now()
    start_date = end_date - timedelta(days=730)
    
    current_date = start_date
    workout_count = 0
    
    # Starting weights for progressive overload
    base_weights = {
        "My Power Bench": 135,
        "Barbell Bench Press": 135,
        "Heavy Goblet Squat": 60,
        "Barbell Squat": 185,
        "Deficit Deadlift": 225,
        "Deadlift": 225,
        "Weighted Pull-ups": 25,
        "Pull-ups": 0,
        "Overhead DB Press": 50,
        "Overhead Press": 95,
        "Barbell Row": 115,
        "Lat Pulldown": 120,
        "Leg Press": 270,
        "Barbell Curl": 65,
        "Leg Curl": 90,
        "Calf Raises": 135,
        "Cable Tricep Pushdown": 70,
        "Hammer Curl": 35,
        "Core Circuit": 0,
    }
    
    # Progressive overload: increase by this much per month
    monthly_increase = {
        "My Power Bench": 5,
        "Barbell Bench Press": 5,
        "Heavy Goblet Squat": 5,
        "Barbell Squat": 10,
        "Deficit Deadlift": 10,
        "Deadlift": 10,
        "Weighted Pull-ups": 2.5,
        "Pull-ups": 0,
        "Overhead DB Press": 2.5,
        "Overhead Press": 5,
        "Barbell Row": 5,
        "Lat Pulldown": 5,
        "Leg Press": 20,
        "Barbell Curl": 2.5,
        "Leg Curl": 5,
        "Calf Raises": 10,
        "Cable Tricep Pushdown": 5,
        "Hammer Curl": 2.5,
        "Core Circuit": 0,
    }
    
    while current_date <= end_date:
        # 4-5 workouts per week (randomly skip some days)
        if random.random() < 0.65:  # ~65% chance of workout each day = ~4.5 per week
            # Rotate through templates
            template_names = list(template_exercise_map.keys())
            template_name = template_names[workout_count % len(template_names)]
            exercise_names = template_exercise_map[template_name]
            
            # Calculate progressive overload (months since start)
            months_elapsed = (current_date - start_date).days / 30
            
            # Create workout session
            start_time_ms = int(current_date.timestamp() * 1000)
            duration_min = random.randint(45, 75)
            end_time_ms = start_time_ms + (duration_min * 60 * 1000)
            
            result = conn.execute(
                sa.text("""
                    INSERT INTO workout_sessions 
                    (user_id, workout_number, workout_name, start_time, end_time, is_active, is_paused, is_completed, 
                     exercises_count, total_sets, total_reps, total_volume, elapsed_seconds, created_at, updated_at)
                    VALUES (:user_id, :workout_num, :name, :start_time, :end_time, FALSE, FALSE, TRUE, 
                            :ex_count, 0, 0, 0, :elapsed, :created, :updated)
                    RETURNING id
                """),
                {
                    "user_id": user_id,
                    "workout_num": workout_count + 1,
                    "name": f"{template_name} – {current_date.strftime('%b %d, %Y')}",
                    "start_time": start_time_ms,
                    "end_time": end_time_ms,
                    "ex_count": len(exercise_names),
                    "elapsed": duration_min * 60,
                    "created": start_time_ms,
                    "updated": end_time_ms
                }
            )
            session_id = result.fetchone()[0]
            
            total_sets = 0
            total_reps = 0
            total_volume = 0.0
            
            # Add exercises and sets
            for ex_position, ex_name in enumerate(exercise_names):
                conn.execute(
                    sa.text("""
                        INSERT INTO workout_exercises (workout_session_id, exercise_name, position)
                        VALUES (:session_id, :ex_name, :position)
                        RETURNING id
                    """),
                    {
                        "session_id": session_id,
                        "ex_name": ex_name,
                        "position": ex_position
                    }
                )
                workout_ex_id = conn.execute(sa.text("SELECT lastval()")).scalar()
                
                # Progressive weight for this exercise
                base_weight = base_weights.get(ex_name, 100)
                progression = monthly_increase.get(ex_name, 5) * months_elapsed
                current_weight = base_weight + progression
                
                # Add some natural variation (±5%)
                current_weight *= random.uniform(0.95, 1.05)
                current_weight = round(current_weight / 5) * 5  # Round to nearest 5
                
                # 3-4 sets per exercise
                num_sets = random.randint(3, 4)
                for set_num in range(num_sets):
                    # First set might be warmup
                    is_warmup = (set_num == 0 and random.random() < 0.3)
                    weight = current_weight * 0.6 if is_warmup else current_weight
                    
                    # Rep ranges: 5-8 for compounds, 8-12 for accessories
                    if ex_name in ["My Power Bench", "Heavy Goblet Squat", "Deficit Deadlift", 
                                   "Barbell Squat", "Deadlift", "Barbell Bench Press"]:
                        reps = random.randint(5, 8)
                    else:
                        reps = random.randint(8, 12)
                    
                    # Slight fatigue in later sets
                    if set_num > 0 and random.random() < 0.4:
                        reps -= 1
                    
                    completed_time = start_time_ms + ((set_num + 1) * 3 * 60 * 1000)  # ~3 min per set
                    
                    conn.execute(
                        sa.text("""
                            INSERT INTO workout_sets 
                            (workout_exercise_id, position, reps, weight, completed, completed_at, 
                             is_warmup, is_dropset, is_failure, rpe)
                            VALUES (:ex_id, :pos, :reps, :weight, TRUE, :completed_at, 
                                    :warmup, FALSE, :failure, :rpe)
                        """),
                        {
                            "ex_id": workout_ex_id,
                            "pos": set_num,
                            "reps": str(reps),
                            "weight": str(int(weight)),
                            "completed_at": completed_time,
                            "warmup": is_warmup,
                            "failure": (set_num == num_sets - 1 and random.random() < 0.2),
                            "rpe": random.randint(7, 9) if not is_warmup else random.randint(4, 6)
                        }
                    )
                    
                    if not is_warmup:
                        total_sets += 1
                        total_reps += reps
                        total_volume += reps * weight
            
            # Update session totals
            conn.execute(
                sa.text("""
                    UPDATE workout_sessions 
                    SET total_sets = :sets, total_reps = :reps, total_volume = :volume
                    WHERE id = :session_id
                """),
                {
                    "sets": total_sets,
                    "reps": total_reps,
                    "volume": total_volume,
                    "session_id": session_id
                }
            )
            
            workout_count += 1
        
        current_date += timedelta(days=1)
    
    print(f"✓ Generated {workout_count} workouts over 2 years")
    print(f"\n{'='*80}")
    print(f"✅ TEST USER CREATED SUCCESSFULLY!")
    print(f"{'='*80}")
    print(f"📧 Email: testuser2years@test.com")
    print(f"🔒 Password: Password123")
    print(f"📊 Total Workouts: {workout_count}")
    print(f"📅 Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"💪 Custom Exercises: {len(custom_exercises)}")
    print(f"📋 Templates: {len(templates)}")
    print(f"{'='*80}")


def downgrade() -> None:
    """Remove test user and all associated data."""
    conn = op.get_bind()
    
    # Get user ID
    result = conn.execute(
        sa.text("SELECT id FROM users WHERE email = 'testuser2years@test.com'")
    )
    row = result.fetchone()
    
    if row:
        user_id = row[0]
        
        # Delete user (cascades to all related data)
        conn.execute(
            sa.text("DELETE FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        )
        
        print(f"✓ Removed test user and all associated data")
