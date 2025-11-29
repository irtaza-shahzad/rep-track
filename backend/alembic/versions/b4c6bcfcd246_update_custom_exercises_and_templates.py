"""update_custom_exercises_and_templates

Revision ID: b4c6bcfcd246
Revises: b2c3d4e5f6g7
Create Date: 2025-11-27 21:02:08.340922

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4c6bcfcd246'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Delete old custom exercises and templates, create diverse new ones."""
    conn = op.get_bind()
    
    print("\n" + "="*60)
    print("DIVERSIFYING CUSTOM EXERCISES AND TEMPLATES")
    print("="*60)
    
    # Get all user IDs (excluding NULL for system)
    users_result = conn.execute(sa.text("SELECT id FROM users ORDER BY id"))
    users = [row[0] for row in users_result]
    
    print(f"\nFound {len(users)} users to update")
    
    # Delete old custom exercises (those with user_id not null)
    print("\nDeleting old custom exercises...")
    conn.execute(sa.text("DELETE FROM exercises WHERE user_id IS NOT NULL"))
    
    # Delete old templates
    print("Deleting old templates...")
    conn.execute(sa.text("DELETE FROM workout_templates"))
    
    from datetime import datetime, timezone
    created_at = datetime.now(timezone.utc)
    
    # Diverse custom exercises for each user
    custom_exercises_sets = [
        # User 1 - Powerlifting focused
        [
            {"name": "Pause Bench Press", "muscle_group": "Chest", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Competition Squat", "muscle_group": "Legs", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Deficit Deadlift", "muscle_group": "Back", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Board Press", "muscle_group": "Chest", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Box Squats", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
        ],
        # User 2 - Bodybuilding focused
        [
            {"name": "Cable Crossover High-Low", "muscle_group": "Chest", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Meadows Row", "muscle_group": "Back", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Arnold Press Variation", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Incline Hammer Curl", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Overhead Cable Extension", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
        ],
        # User 3 - Functional fitness
        [
            {"name": "Turkish Get-Up", "muscle_group": "Core", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Kettlebell Swing", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Battle Rope Waves", "muscle_group": "Other", "category": "Cardio", "difficulty": "Beginner"},
            {"name": "Box Jump Variation", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Sled Push", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
        ],
        # User 4 - Calisthenics focused
        [
            {"name": "Archer Push-ups", "muscle_group": "Chest", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Typewriter Pull-ups", "muscle_group": "Back", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Pistol Squats", "muscle_group": "Legs", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Dragon Flag", "muscle_group": "Core", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Planche Progression", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Advanced"},
        ],
        # User 5 - Athletic/Sports performance
        [
            {"name": "Power Clean", "muscle_group": "Legs", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Snatch Grip Deadlift", "muscle_group": "Back", "category": "Strength", "difficulty": "Advanced"},
            {"name": "Med Ball Slam", "muscle_group": "Core", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Broad Jump", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Agility Ladder Drills", "muscle_group": "Other", "category": "Cardio", "difficulty": "Beginner"},
        ],
        # User 6 - Hybrid training
        [
            {"name": "Assault Bike Intervals", "muscle_group": "Other", "category": "Cardio", "difficulty": "Intermediate"},
            {"name": "Sandbag Carry", "muscle_group": "Core", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Farmer's Walk Heavy", "muscle_group": "Core", "category": "Strength", "difficulty": "Intermediate"},
            {"name": "Burpee Pull-up", "muscle_group": "Other", "category": "Cardio", "difficulty": "Advanced"},
            {"name": "Wall Ball Shots", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
        ],
        # User 7 - Aesthetics focused
        [
            {"name": "High Cable Fly", "muscle_group": "Chest", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Seated Cable Row Wide Grip", "muscle_group": "Back", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Rear Delt Fly Machine", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Preacher Curl EZ Bar", "muscle_group": "Arms", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Leg Extension Drop Sets", "muscle_group": "Legs", "category": "Strength", "difficulty": "Intermediate"},
        ],
        # User 8 - General fitness
        [
            {"name": "Goblet Squat", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Dumbbell Floor Press", "muscle_group": "Chest", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Single Arm Row", "muscle_group": "Back", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Face Pull", "muscle_group": "Shoulders", "category": "Strength", "difficulty": "Beginner"},
            {"name": "Step-ups", "muscle_group": "Legs", "category": "Strength", "difficulty": "Beginner"},
        ],
    ]
    
    # Create custom exercises for each user
    print("\nCreating diverse custom exercises for each user...")
    for i, user_id in enumerate(users):
        exercises = custom_exercises_sets[i % len(custom_exercises_sets)]
        for ex in exercises:
            conn.execute(sa.text("""
                INSERT INTO exercises (user_id, name, muscle_group, category, difficulty, created_at)
                VALUES (:user_id, :name, :muscle_group, :category, :difficulty, :created_at)
            """), {**ex, "user_id": user_id, "created_at": created_at})
        print(f"  User {user_id}: Created {len(exercises)} custom exercises")
    
    # Get system exercise IDs for templates
    system_exercises = {}
    result = conn.execute(sa.text("SELECT id, name FROM exercises WHERE user_id IS NULL"))
    for row in result:
        system_exercises[row[1]] = row[0]
    
    # Diverse template sets for each user
    templates_sets = [
        # User 1 - Powerlifting templates
        [
            {
                "name": "Competition Prep - Squat Focus",
                "description": "Heavy squat day with accessories",
                "exercises": ["Competition Squat", "Box Squats", "Romanian Deadlift", "Leg Press", "Plank"],
                "system_exercises": ["Romanian Deadlift", "Leg Press", "Plank"]
            },
            {
                "name": "Competition Prep - Bench Focus",
                "description": "Heavy bench with tricep work",
                "exercises": ["Pause Bench Press", "Board Press", "Incline Barbell Bench Press", "Cable Tricep Pushdown", "Dumbbell Fly"],
                "system_exercises": ["Incline Barbell Bench Press", "Cable Tricep Pushdown", "Dumbbell Fly"]
            },
            {
                "name": "Competition Prep - Deadlift Focus",
                "description": "Heavy deadlift with back work",
                "exercises": ["Deficit Deadlift", "Barbell Row", "Pull-ups", "Barbell Shrugs", "Ab Wheel Rollout"],
                "system_exercises": ["Barbell Row", "Pull-ups", "Barbell Shrugs", "Ab Wheel Rollout"]
            },
        ],
        # User 2 - Bodybuilding templates
        [
            {
                "name": "Chest & Arms Hypertrophy",
                "description": "High volume chest and arms",
                "exercises": ["Barbell Bench Press", "Cable Crossover High-Low", "Incline Hammer Curl", "Overhead Cable Extension", "Dumbbell Fly"],
                "system_exercises": ["Barbell Bench Press", "Dumbbell Fly"]
            },
            {
                "name": "Back & Shoulders Volume",
                "description": "Complete back and shoulder hypertrophy",
                "exercises": ["Meadows Row", "Lat Pulldown", "Arnold Press Variation", "Lateral Raises", "Face Pulls"],
                "system_exercises": ["Lat Pulldown", "Lateral Raises", "Face Pulls"]
            },
            {
                "name": "Leg Hypertrophy Day",
                "description": "High rep leg building",
                "exercises": ["Leg Press", "Walking Lunges", "Leg Curl", "Leg Extension", "Calf Raises"],
                "system_exercises": ["Leg Press", "Walking Lunges", "Leg Curl", "Leg Extension", "Calf Raises"]
            },
        ],
        # User 3 - Functional fitness templates
        [
            {
                "name": "Functional Strength Circuit",
                "description": "Full body functional movements",
                "exercises": ["Turkish Get-Up", "Kettlebell Swing", "Box Jump Variation", "Battle Rope Waves", "Plank"],
                "system_exercises": ["Plank"]
            },
            {
                "name": "Conditioning & Power",
                "description": "High intensity conditioning work",
                "exercises": ["Sled Push", "Battle Rope Waves", "Box Jump Variation", "Jump Rope", "Running"],
                "system_exercises": ["Jump Rope", "Running"]
            },
            {
                "name": "Loaded Carries & Core",
                "description": "Carry variations and core strength",
                "exercises": ["Kettlebell Swing", "Turkish Get-Up", "Farmer's Walk", "Plank", "Russian Twists"],
                "system_exercises": ["Farmer's Walk", "Plank", "Russian Twists"]
            },
        ],
        # User 4 - Calisthenics templates
        [
            {
                "name": "Advanced Push Workout",
                "description": "Difficult push variations",
                "exercises": ["Archer Push-ups", "Planche Progression", "Handstand Push-ups", "Tricep Dips", "Pike Push-ups"],
                "system_exercises": ["Handstand Push-ups", "Tricep Dips", "Pike Push-ups"]
            },
            {
                "name": "Advanced Pull Workout",
                "description": "Difficult pull variations",
                "exercises": ["Typewriter Pull-ups", "Pull-ups", "Dragon Flag", "Chin-ups", "Hanging Leg Raises"],
                "system_exercises": ["Pull-ups", "Chin-ups", "Hanging Leg Raises"]
            },
            {
                "name": "Lower Body Calisthenics",
                "description": "Bodyweight leg strength",
                "exercises": ["Pistol Squats", "Jumping Lunges", "Single Leg Glute Bridge", "Bodyweight Squats"],
                "system_exercises": ["Jumping Lunges", "Single Leg Glute Bridge", "Bodyweight Squats"]
            },
        ],
        # User 5 - Athletic templates
        [
            {
                "name": "Olympic Lifting Day",
                "description": "Power and explosive strength",
                "exercises": ["Power Clean", "Snatch Grip Deadlift", "Front Squat", "Overhead Press", "Med Ball Slam"],
                "system_exercises": ["Front Squat", "Overhead Press"]
            },
            {
                "name": "Speed & Agility Training",
                "description": "Athletic performance work",
                "exercises": ["Broad Jump", "Agility Ladder Drills", "Box Jump Variation", "Sprints", "Jump Rope"],
                "system_exercises": ["Sprints", "Jump Rope"]
            },
            {
                "name": "Power Development",
                "description": "Explosive power exercises",
                "exercises": ["Power Clean", "Box Jumps", "Med Ball Slam", "Broad Jump", "Barbell Squat"],
                "system_exercises": ["Box Jumps", "Barbell Squat"]
            },
        ],
        # User 6 - Hybrid templates
        [
            {
                "name": "Strength + Conditioning",
                "description": "Combined strength and cardio",
                "exercises": ["Deadlift", "Assault Bike Intervals", "Barbell Squat", "Rowing Machine", "Burpee Pull-up"],
                "system_exercises": ["Deadlift", "Barbell Squat", "Rowing Machine"]
            },
            {
                "name": "Loaded Carries Workout",
                "description": "Carry variations for strength",
                "exercises": ["Sandbag Carry", "Farmer's Walk Heavy", "Walking Lunges", "Sled Push", "Wall Ball Shots"],
                "system_exercises": ["Walking Lunges"]
            },
            {
                "name": "CrossFit Style WOD",
                "description": "High intensity functional fitness",
                "exercises": ["Wall Ball Shots", "Burpee Pull-up", "Deadlift", "Box Jumps", "Assault Bike Intervals"],
                "system_exercises": ["Deadlift", "Box Jumps"]
            },
        ],
        # User 7 - Aesthetics templates
        [
            {
                "name": "Upper Body Pump",
                "description": "High volume upper body",
                "exercises": ["Barbell Bench Press", "High Cable Fly", "Seated Cable Row Wide Grip", "Preacher Curl EZ Bar", "Cable Tricep Pushdown"],
                "system_exercises": ["Barbell Bench Press", "Cable Tricep Pushdown"]
            },
            {
                "name": "Shoulder & Back Focus",
                "description": "Complete shoulder and back work",
                "exercises": ["Dumbbell Shoulder Press", "Rear Delt Fly Machine", "Lat Pulldown", "Lateral Raises", "Barbell Row"],
                "system_exercises": ["Dumbbell Shoulder Press", "Lat Pulldown", "Lateral Raises", "Barbell Row"]
            },
            {
                "name": "Leg Definition Day",
                "description": "High rep leg sculpting",
                "exercises": ["Barbell Squat", "Leg Extension Drop Sets", "Leg Curl", "Walking Lunges", "Calf Raises"],
                "system_exercises": ["Barbell Squat", "Leg Curl", "Walking Lunges", "Calf Raises"]
            },
        ],
        # User 8 - General fitness templates
        [
            {
                "name": "Full Body Strength",
                "description": "Basic compound movements",
                "exercises": ["Goblet Squat", "Dumbbell Floor Press", "Single Arm Row", "Overhead Press", "Plank"],
                "system_exercises": ["Overhead Press", "Plank"]
            },
            {
                "name": "Upper Body Basics",
                "description": "Simple upper body workout",
                "exercises": ["Dumbbell Floor Press", "Single Arm Row", "Face Pull", "Dumbbell Curl", "Tricep Dips"],
                "system_exercises": ["Dumbbell Curl", "Tricep Dips"]
            },
            {
                "name": "Lower Body Fundamentals",
                "description": "Essential leg exercises",
                "exercises": ["Goblet Squat", "Step-ups", "Romanian Deadlift", "Leg Curl", "Calf Raises"],
                "system_exercises": ["Romanian Deadlift", "Leg Curl", "Calf Raises"]
            },
        ],
    ]
    
    # Create diverse templates for each user
    print("\nCreating diverse templates with custom exercises for each user...")
    for i, user_id in enumerate(users):
        # Get custom exercises for this user
        custom_ex_result = conn.execute(sa.text(
            "SELECT id, name FROM exercises WHERE user_id = :user_id"
        ), {"user_id": user_id})
        custom_exercises = {row[1]: row[0] for row in custom_ex_result}
        
        templates = templates_sets[i % len(templates_sets)]
        for template_data in templates:
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
            
            # Add exercises to template (mix of custom and system)
            position = 0
            for exercise_name in template_data["exercises"]:
                exercise_id = None
                
                # Try custom exercises first
                if exercise_name in custom_exercises:
                    exercise_id = custom_exercises[exercise_name]
                # Fall back to system exercises
                elif exercise_name in system_exercises:
                    exercise_id = system_exercises[exercise_name]
                
                if exercise_id:
                    conn.execute(sa.text("""
                        INSERT INTO template_exercises (template_id, exercise_id, position, sets, reps, rest_seconds)
                        VALUES (:template_id, :exercise_id, :position, :sets, :reps, :rest_seconds)
                    """), {
                        "template_id": template_id,
                        "exercise_id": exercise_id,
                        "position": position,
                        "sets": 4,
                        "reps": 10,
                        "rest_seconds": 90
                    })
                    position += 1
        
        print(f"  User {user_id}: Created {len(templates)} diverse templates")
    
    print("\n" + "="*60)
    print("✅ DIVERSIFICATION COMPLETE!")
    print("="*60)


def downgrade() -> None:
    """Downgrade - not implemented."""
    pass
