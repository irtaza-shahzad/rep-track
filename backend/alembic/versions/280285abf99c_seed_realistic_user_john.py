"""seed_realistic_user_john

Revision ID: 280285abf99c
Revises: 0b63a357dd4d
Create Date: 2025-11-29 16:33:01.817882

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timedelta
import random
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision: str = '280285abf99c'
down_revision: Union[str, Sequence[str], None] = '0b63a357dd4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    """Create realistic user 'John' with 1 year of varied workout history."""
    
    conn = op.get_bind()
    
    # Create user: john.doe@fitness.com / JohnDoe123
    hashed_password = pwd_context.hash("JohnDoe123")
    result = conn.execute(
        sa.text("""
            INSERT INTO users (email, name, password, created_at)
            VALUES (:email, :name, :password, :created_at)
            RETURNING id
        """),
        {
            "email": "john.doe@fitness.com",
            "name": "John Doe",
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }
    )
    user_id = result.fetchone()[0]
    print(f"✓ Created user John Doe (ID: {user_id}): john.doe@fitness.com")
    
    # Create custom exercises
    custom_exercises = [
        ("Pause Bench Press", "Chest", "Strength", "Intermediate", "Bench press with 2-second pause at bottom"),
        ("Front Rack Lunges", "Legs", "Strength", "Intermediate", "Walking lunges holding barbell in front rack"),
        ("Pendlay Rows", "Back", "Strength", "Intermediate", "Explosive rows from dead stop"),
        ("Z Press", "Shoulders", "Strength", "Advanced", "Overhead press seated on floor"),
        ("Reverse Grip Bench", "Chest", "Strength", "Intermediate", "Bench press with reverse grip for upper chest"),
        ("Box Squats", "Legs", "Strength", "Intermediate", "Squats to box for depth consistency"),
        ("Face Pulls", "Shoulders", "Strength", "Beginner", "Cable face pulls for rear delts"),
        ("Farmer Walks", "Core", "Strength", "Beginner", "Loaded carries with dumbbells or kettlebells"),
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
    
    # Get some common exercises from database
    existing_exercises = conn.execute(
        sa.text("SELECT id, name FROM exercises WHERE user_id IS NULL ORDER BY name LIMIT 30")
    ).fetchall()
    for ex_id, ex_name in existing_exercises:
        exercise_ids[ex_name] = ex_id
    
    # Create workout templates with mix of custom and common exercises
    templates = [
        {
            "name": "Push Day",
            "exercises": ["Pause Bench Press", "Overhead Press", "Incline Dumbbell Press", "Lateral Raise", "Cable Tricep Pushdown", "Face Pulls"]
        },
        {
            "name": "Pull Day", 
            "exercises": ["Deadlift", "Pendlay Rows", "Pull-ups", "Lat Pulldown", "Barbell Curl", "Hammer Curl"]
        },
        {
            "name": "Leg Day",
            "exercises": ["Box Squats", "Front Rack Lunges", "Leg Press", "Romanian Deadlift", "Leg Curl", "Calf Raises"]
        },
        {
            "name": "Upper Power",
            "exercises": ["Reverse Grip Bench", "Z Press", "Barbell Row", "Dumbbell Bench Press", "Dips", "Farmer Walks"]
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
    
    # Generate 1 year of realistic workout data
    # Starting from 1 year ago, ending yesterday (to avoid future timestamps)
    end_date = datetime.now() - timedelta(days=1)  # End yesterday to avoid future timestamps
    start_date = end_date - timedelta(days=365)
    
    current_date = start_date
    workout_count = 0
    
    # Base weights that will progress over time
    base_weights = {
        "Pause Bench Press": 135,
        "Reverse Grip Bench": 115,
        "Box Squats": 185,
        "Deadlift": 225,
        "Pendlay Rows": 135,
        "Z Press": 85,
        "Front Rack Lunges": 95,
        "Pull-ups": 0,  # Bodyweight
        "Overhead Press": 95,
        "Incline Dumbbell Press": 60,
        "Lateral Raise": 20,
        "Cable Tricep Pushdown": 70,
        "Face Pulls": 50,
        "Barbell Row": 135,
        "Lat Pulldown": 120,
        "Barbell Curl": 65,
        "Hammer Curl": 35,
        "Leg Press": 270,
        "Romanian Deadlift": 135,
        "Leg Curl": 90,
        "Calf Raises": 135,
        "Dumbbell Bench Press": 70,
        "Dips": 0,  # Bodyweight
        "Farmer Walks": 60,
    }
    
    # Monthly progression rates (some exercises progress faster)
    monthly_progression = {
        "Pause Bench Press": 5,
        "Reverse Grip Bench": 4,
        "Box Squats": 10,
        "Deadlift": 10,
        "Pendlay Rows": 5,
        "Z Press": 3,
        "Front Rack Lunges": 5,
        "Pull-ups": 2,
        "Overhead Press": 4,
        "Incline Dumbbell Press": 3,
        "Lateral Raise": 1,
        "Cable Tricep Pushdown": 3,
        "Face Pulls": 2,
        "Barbell Row": 5,
        "Lat Pulldown": 4,
        "Barbell Curl": 2,
        "Hammer Curl": 2,
        "Leg Press": 15,
        "Romanian Deadlift": 5,
        "Leg Curl": 3,
        "Calf Raises": 5,
        "Dumbbell Bench Press": 3,
        "Dips": 1,
        "Farmer Walks": 5,
    }
    
    # Simulate realistic workout patterns
    template_rotation = list(template_exercise_map.keys())
    current_template_idx = 0
    
    # Life events that affect workout consistency
    vacation_weeks = []  # Will miss entire weeks
    sick_weeks = []      # Reduced intensity/frequency
    busy_weeks = []      # Miss some workouts
    
    # Randomly assign challenging weeks throughout the year
    for week in range(52):
        rand = random.random()
        if rand < 0.04:  # 4% chance of vacation week
            vacation_weeks.append(week)
        elif rand < 0.10:  # 6% chance of sick week
            sick_weeks.append(week)
        elif rand < 0.25:  # 15% chance of busy week
            busy_weeks.append(week)
    
    # Track consecutive workouts for natural variation
    consecutive_workouts = 0
    last_workout_date = None
    
    while current_date <= end_date:
        week_num = (current_date - start_date).days // 7
        day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
        
        # Skip vacation weeks entirely
        if week_num in vacation_weeks:
            current_date += timedelta(days=1)
            consecutive_workouts = 0
            continue
        
        # Determine if workout happens today
        workout_today = False
        
        # Normal schedule: Mon, Wed, Fri, Sat (4x per week)
        if day_of_week in [0, 2, 4, 5]:
            workout_today = True
            
            # Sick weeks: only 1-2 workouts
            if week_num in sick_weeks:
                if day_of_week not in [0, 4]:  # Only Mon and Fri
                    workout_today = False
                if random.random() < 0.3:  # 30% chance to skip even those
                    workout_today = False
            
            # Busy weeks: miss some workouts
            elif week_num in busy_weeks:
                if random.random() < 0.4:  # 40% chance to skip
                    workout_today = False
            
            # Random misses (life happens)
            elif random.random() < 0.08:  # 8% chance of random skip
                workout_today = False
            
            # Avoid too many consecutive workouts (fatigue)
            if consecutive_workouts >= 5 and random.random() < 0.6:
                workout_today = False
        
        if not workout_today:
            current_date += timedelta(days=1)
            consecutive_workouts = 0
            continue
        
        consecutive_workouts += 1
        
        # Select template (rotate through)
        template_name = template_rotation[current_template_idx]
        current_template_idx = (current_template_idx + 1) % len(template_rotation)
        exercise_names = template_exercise_map[template_name]
        
        # Calculate progression
        months_elapsed = (current_date - start_date).days / 30.0
        
        # Some workouts are better/worse than others
        performance_factor = 1.0
        if week_num in sick_weeks:
            performance_factor = random.uniform(0.7, 0.85)  # Sick = less weight
        elif consecutive_workouts >= 4:
            performance_factor = random.uniform(0.90, 0.98)  # Fatigue
        elif last_workout_date and (current_date - last_workout_date).days >= 3:
            performance_factor = random.uniform(1.02, 1.08)  # Well rested
        else:
            performance_factor = random.uniform(0.95, 1.05)  # Normal variation
        
        # Workout duration varies
        if week_num in sick_weeks:
            duration_min = random.randint(25, 40)  # Shorter when sick
        elif consecutive_workouts >= 4:
            duration_min = random.randint(40, 55)  # Shorter when fatigued
        else:
            duration_min = random.randint(50, 75)  # Normal duration
        
        # Create workout session
        start_time_ms = int(current_date.replace(hour=random.randint(8, 19), minute=random.randint(0, 59)).timestamp() * 1000)
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
                """),
                {
                    "session_id": session_id,
                    "ex_name": ex_name,
                    "position": ex_position
                }
            )
            workout_ex_id = conn.execute(sa.text("SELECT lastval()")).scalar()
            
            # Calculate current weight with progression
            base_weight = base_weights.get(ex_name, 100)
            progression = monthly_progression.get(ex_name, 5) * months_elapsed
            current_weight = (base_weight + progression) * performance_factor
            current_weight = round(current_weight / 5) * 5  # Round to nearest 5
            
            # Varying number of sets (realistic)
            is_main_lift = ex_name in ["Pause Bench Press", "Box Squats", "Deadlift", "Pendlay Rows", "Reverse Grip Bench"]
            
            if is_main_lift:
                num_sets = random.choice([3, 4, 4, 5])  # Main lifts: 3-5 sets (mostly 4)
            else:
                num_sets = random.choice([2, 3, 3, 3, 4])  # Accessories: 2-4 sets (mostly 3)
            
            # Sometimes skip exercises when fatigued or short on time
            if duration_min < 45 and ex_position >= len(exercise_names) - 2:
                if random.random() < 0.4:
                    num_sets = max(1, num_sets - 1)
            
            for set_num in range(num_sets):
                # First set is often warmup for main lifts
                is_warmup = (set_num == 0 and is_main_lift and random.random() < 0.5)
                weight = current_weight * 0.6 if is_warmup else current_weight
                
                # Rep ranges vary by exercise type
                if is_main_lift:
                    base_reps = random.randint(4, 6) if not is_warmup else random.randint(8, 10)
                else:
                    base_reps = random.randint(8, 12)
                
                # Fatigue in later sets
                reps = base_reps
                if set_num > 0:
                    fatigue_loss = random.randint(0, min(2, set_num))
                    reps = max(1, base_reps - fatigue_loss)
                
                # Sometimes hit failure or push for extra reps
                if random.random() < 0.15 and not is_warmup:
                    reps += random.randint(1, 3)  # Extra reps
                elif random.random() < 0.10 and not is_warmup:
                    reps = max(1, reps - random.randint(1, 3))  # Failed set
                
                completed_time = start_time_ms + ((ex_position * num_sets + set_num + 1) * 3 * 60 * 1000)
                
                is_failure = (set_num == num_sets - 1 and random.random() < 0.25 and not is_warmup)
                rpe = random.randint(4, 6) if is_warmup else random.randint(7, 10)
                
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
                        "failure": is_failure,
                        "rpe": rpe
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
        last_workout_date = current_date
        current_date += timedelta(days=1)
    
    print(f"✓ Generated {workout_count} workouts over 1 year with realistic patterns")
    print(f"  - Vacation weeks: {len(vacation_weeks)}")
    print(f"  - Sick weeks: {len(sick_weeks)}")
    print(f"  - Busy weeks: {len(busy_weeks)}")
    print(f"\n{'='*80}")
    print(f"✅ REALISTIC USER CREATED SUCCESSFULLY!")
    print(f"{'='*80}")
    print(f"📧 Email: john.doe@fitness.com")
    print(f"🔒 Password: JohnDoe123")
    print(f"📊 Total Workouts: {workout_count}")
    print(f"📅 Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"💪 Custom Exercises: {len(custom_exercises)}")
    print(f"📋 Templates: {len(templates)}")
    print(f"{'='*80}")


def downgrade() -> None:
    """Remove John Doe user and all associated data."""
    conn = op.get_bind()
    
    result = conn.execute(
        sa.text("SELECT id FROM users WHERE email = 'john.doe@fitness.com'")
    )
    row = result.fetchone()
    
    if row:
        user_id = row[0]
        conn.execute(sa.text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})
        print(f"✓ Removed user john.doe@fitness.com and all associated data")
    else:
        print("User john.doe@fitness.com not found")

