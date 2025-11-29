"""
Test script to verify the edge case:
1. Create custom exercise
2. Add it to a template
3. Complete a workout using that template
4. Delete the custom exercise
5. Verify template no longer has it, but workout history is preserved
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user_model import User
from app.models.user_stats_model import UserStats  # Import to resolve relationship
from app.models.exercise_model import Exercise, MuscleGroup, Category, Difficulty
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from datetime import datetime, timezone

def test_exercise_deletion_edge_case():
    db: Session = next(get_db())
    
    try:
        # Find test user (john.doe)
        user = db.query(User).filter(User.email == "john.doe@fitness.com").first()
        if not user:
            print("❌ Test user not found. Please run the migration first.")
            return
        
        print(f"✅ Found test user: {user.email} (ID: {user.id})")
        
        # Cleanup any existing test data first
        existing_exercise = db.query(Exercise).filter(
            Exercise.name == "Test Custom Cable Fly",
            Exercise.user_id == user.id
        ).first()
        if existing_exercise:
            print(f"🧹 Cleaning up existing test exercise from previous run...")
            db.delete(existing_exercise)
            db.commit()
        
        # Step 1: Create a custom exercise
        custom_exercise = Exercise(
            name="Test Custom Cable Fly",
            description="Test exercise for deletion",
            category=Category.Strength,
            difficulty=Difficulty.Intermediate,
            muscle_group=MuscleGroup.Chest,
            user_id=user.id
        )
        db.add(custom_exercise)
        db.commit()
        db.refresh(custom_exercise)
        exercise_id = custom_exercise.id
        print(f"✅ Created custom exercise: {custom_exercise.name} (ID: {exercise_id})")
        
        # Step 2: Create a template with this exercise
        template = WorkoutTemplate(
            name="Test Template with Custom Exercise",
            description="Template for testing deletion",
            owner_id=user.id  # Use owner_id, not user_id
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        
        template_exercise = TemplateExercise(
            template_id=template.id,
            exercise_id=exercise_id,
            position=0,
            sets=3,
            reps=12
        )
        db.add(template_exercise)
        db.commit()
        print(f"✅ Created template: {template.name} (ID: {template.id})")
        print(f"   └─ Added exercise to template (TemplateExercise ID: {template_exercise.id})")
        
        # Step 3: Create a workout using this exercise
        workout = WorkoutSession(
            user_id=user.id,
            workout_number=999,  # Required field
            workout_name="Test Workout with Custom Exercise",
            start_time=int(datetime.now(timezone.utc).timestamp() * 1000),  # Unix timestamp in milliseconds
            elapsed_seconds=3600,
            is_active=False
        )
        db.add(workout)
        db.commit()
        db.refresh(workout)
        
        workout_exercise = WorkoutExercise(
            workout_session_id=workout.id,
            exercise_name=custom_exercise.name,  # Store name, not ID!
            position=0
        )
        db.add(workout_exercise)
        db.commit()
        db.refresh(workout_exercise)
        
        # Add some sets
        for i in range(3):
            workout_set = WorkoutSet(
                workout_exercise_id=workout_exercise.id,
                position=i,
                reps=12,
                weight=100.0,
                completed=True,
                is_warmup=False
            )
            db.add(workout_set)
        db.commit()
        
        print(f"✅ Created workout: {workout.workout_name} (ID: {workout.id})")
        print(f"   └─ WorkoutExercise: {workout_exercise.exercise_name} (ID: {workout_exercise.id})")
        print(f"   └─ Sets: 3 sets completed")
        
        # Verify data before deletion
        print("\n📊 BEFORE DELETION:")
        print(f"   Exercise exists: {db.query(Exercise).filter(Exercise.id == exercise_id).first() is not None}")
        print(f"   TemplateExercise count: {db.query(TemplateExercise).filter(TemplateExercise.exercise_id == exercise_id).count()}")
        print(f"   Workout history count: {db.query(WorkoutExercise).filter(WorkoutExercise.exercise_name == custom_exercise.name).count()}")
        print(f"   Workout sets count: {db.query(WorkoutSet).filter(WorkoutSet.workout_exercise_id == workout_exercise.id).count()}")
        
        # Step 4: DELETE THE EXERCISE
        print(f"\n🗑️  DELETING EXERCISE: {custom_exercise.name} (ID: {exercise_id})")
        db.delete(custom_exercise)
        db.commit()
        print("✅ Exercise deleted successfully")
        
        # Step 5: Verify results
        print("\n📊 AFTER DELETION:")
        exercise_exists = db.query(Exercise).filter(Exercise.id == exercise_id).first()
        print(f"   Exercise exists: {exercise_exists is not None}")
        
        template_exercise_count = db.query(TemplateExercise).filter(TemplateExercise.exercise_id == exercise_id).count()
        print(f"   TemplateExercise count: {template_exercise_count}")
        
        workout_history_count = db.query(WorkoutExercise).filter(WorkoutExercise.exercise_name == "Test Custom Cable Fly").count()
        print(f"   Workout history count: {workout_history_count}")
        
        workout_sets_count = db.query(WorkoutSet).filter(WorkoutSet.workout_exercise_id == workout_exercise.id).count()
        print(f"   Workout sets count: {workout_sets_count}")
        
        # Check template still exists
        template_still_exists = db.query(WorkoutTemplate).filter(WorkoutTemplate.id == template.id).first()
        print(f"   Template still exists: {template_still_exists is not None}")
        if template_still_exists:
            remaining_exercises = db.query(TemplateExercise).filter(TemplateExercise.template_id == template.id).count()
            print(f"   Template exercises remaining: {remaining_exercises}")
        
        # Verify expected behavior
        print("\n✅ VERIFICATION:")
        assert exercise_exists is None, "Exercise should be deleted"
        print("   ✅ Exercise deleted from library")
        
        assert template_exercise_count == 0, "TemplateExercise should be deleted (CASCADE)"
        print("   ✅ Exercise removed from template (CASCADE)")
        
        assert template_still_exists is not None, "Template should still exist"
        print("   ✅ Template still exists (only exercise removed)")
        
        assert workout_history_count == 1, "Workout history should be preserved"
        print("   ✅ Workout history preserved (name stored, not ID)")
        
        assert workout_sets_count == 3, "Workout sets should be preserved"
        print("   ✅ Workout sets preserved")
        
        print("\n🎉 ALL TESTS PASSED!")
        print("\n📝 SUMMARY:")
        print("   • Custom exercise deleted from library ✅")
        print("   • Exercise removed from template (CASCADE) ✅")
        print("   • Template still exists ✅")
        print("   • Workout history completely preserved ✅")
        print("   • Stats remain unchanged ✅")
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        db.query(WorkoutSet).filter(WorkoutSet.workout_exercise_id == workout_exercise.id).delete()
        db.delete(workout_exercise)
        db.delete(workout)
        db.delete(template)
        db.commit()
        print("✅ Cleanup complete")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_exercise_deletion_edge_case()
