# app/api/services/active_workout_service.py
"""
Service layer for active workout management.
Handles all business logic for live workout sessions.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import Optional, List
import time

from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.api.schemas.workout_schema import (
    StartWorkoutRequest,
    UpdateWorkoutRequest,
    AddExerciseRequest,
    WorkoutSetCreate,
    WorkoutSetUpdate,
    FinishWorkoutRequest,
)


def get_active_workout(db: Session, user_id: int) -> Optional[WorkoutSession]:
    """Get user's current active workout with all exercises and sets loaded."""
    return db.query(WorkoutSession).options(
        joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.workout_sets)
    ).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.is_active == True
    ).first()


def start_workout(
    db: Session,
    user_id: int,
    data: StartWorkoutRequest
) -> WorkoutSession:
    """
    Start a new workout session (empty or from template).
    Enforces one active workout per user constraint.
    """
    # Check if user already has an active workout
    existing = get_active_workout(db, user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active workout. Please finish or cancel it first."
        )
    
    # Get next workout number for this user
    max_number = db.query(func.max(WorkoutSession.workout_number)).filter(
        WorkoutSession.user_id == user_id
    ).scalar() or 0
    workout_number = max_number + 1
    
    # Create workout session
    current_time_ms = int(time.time() * 1000)
    workout = WorkoutSession(
        user_id=user_id,
        template_id=data.template_id,
        workout_number=workout_number,
        workout_name=data.workout_name,
        start_time=current_time_ms,
        elapsed_seconds=0,
        is_active=True,
        is_paused=False,
        is_completed=False,
        created_at=current_time_ms,
        updated_at=current_time_ms
    )
    
    db.add(workout)
    db.flush()  # Get workout ID
    
    # If starting from template, add exercises
    if data.template_id:
        template = db.query(WorkoutTemplate).options(
            joinedload(WorkoutTemplate.template_exercises)
        ).filter(
            WorkoutTemplate.id == data.template_id,
            WorkoutTemplate.owner_id == user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Add exercises from template
        for template_ex in template.template_exercises:
            exercise = WorkoutExercise(
                workout_session_id=workout.id,
                exercise_name=template_ex.exercise.name,
                position=template_ex.position
            )
            db.add(exercise)
            db.flush()
            
            # Add one empty set per exercise
            empty_set = WorkoutSet(
                workout_exercise_id=exercise.id,
                position=0,
                reps='',
                weight='',
                completed=False
            )
            db.add(empty_set)
    
    db.commit()
    db.refresh(workout)
    
    return workout


def update_workout(
    db: Session,
    user_id: int,
    data: UpdateWorkoutRequest
) -> WorkoutSession:
    """Update active workout metadata (name, elapsed time, pause state)."""
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    # Update fields if provided
    if data.workout_name is not None:
        workout.workout_name = data.workout_name
    if data.elapsed_seconds is not None:
        workout.elapsed_seconds = data.elapsed_seconds
    if data.is_paused is not None:
        workout.is_paused = data.is_paused
    if data.notes is not None:
        workout.notes = data.notes
    
    workout.updated_at = int(time.time() * 1000)
    
    db.commit()
    db.refresh(workout)
    
    return workout


def add_exercise_to_workout(
    db: Session,
    user_id: int,
    data: AddExerciseRequest
) -> WorkoutExercise:
    """Add a new exercise to the active workout."""
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    # Get next position
    max_position = db.query(func.max(WorkoutExercise.position)).filter(
        WorkoutExercise.workout_session_id == workout.id
    ).scalar() or -1
    
    # Create exercise
    exercise = WorkoutExercise(
        workout_session_id=workout.id,
        exercise_name=data.exercise_name,
        position=max_position + 1
    )
    db.add(exercise)
    db.flush()
    
    # Add one empty set
    empty_set = WorkoutSet(
        workout_exercise_id=exercise.id,
        position=0,
        reps='',
        weight='',
        completed=False
    )
    db.add(empty_set)
    
    workout.updated_at = int(time.time() * 1000)
    
    db.commit()
    db.refresh(exercise)
    
    return exercise


def remove_exercise_from_workout(
    db: Session,
    user_id: int,
    exercise_id: int
) -> None:
    """Remove an exercise from the active workout."""
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    exercise = db.query(WorkoutExercise).filter(
        WorkoutExercise.id == exercise_id,
        WorkoutExercise.workout_session_id == workout.id
    ).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in workout"
        )
    
    db.delete(exercise)
    workout.updated_at = int(time.time() * 1000)
    db.commit()


def add_set_to_exercise(
    db: Session,
    user_id: int,
    exercise_id: int,
    data: WorkoutSetCreate
) -> WorkoutSet:
    """Add a new set to an exercise in the active workout."""
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    exercise = db.query(WorkoutExercise).filter(
        WorkoutExercise.id == exercise_id,
        WorkoutExercise.workout_session_id == workout.id
    ).first()
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in workout"
        )
    
    # Get next position
    max_position = db.query(func.max(WorkoutSet.position)).filter(
        WorkoutSet.workout_exercise_id == exercise.id
    ).scalar() or -1
    
    # Create set
    new_set = WorkoutSet(
        workout_exercise_id=exercise.id,
        position=max_position + 1,
        reps=data.reps,
        weight=data.weight,
        rpe=data.rpe,
        completed=data.completed,
        is_warmup=data.is_warmup,
        is_dropset=data.is_dropset,
        is_failure=data.is_failure,
        completed_at=int(time.time() * 1000) if data.completed else None
    )
    
    db.add(new_set)
    workout.updated_at = int(time.time() * 1000)
    db.commit()
    db.refresh(new_set)
    
    return new_set


def update_set(
    db: Session,
    user_id: int,
    set_id: int,
    data: WorkoutSetUpdate
) -> WorkoutSet:
    """Update a set in the active workout."""
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    # Get set with exercise join to verify it belongs to this workout
    workout_set = db.query(WorkoutSet).join(WorkoutExercise).filter(
        WorkoutSet.id == set_id,
        WorkoutExercise.workout_session_id == workout.id
    ).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set not found in workout"
        )
    
    # Update fields if provided
    if data.reps is not None:
        workout_set.reps = data.reps
    if data.weight is not None:
        workout_set.weight = data.weight
    if data.rpe is not None:
        workout_set.rpe = data.rpe
    if data.completed is not None:
        workout_set.completed = data.completed
        if data.completed and not workout_set.completed_at:
            workout_set.completed_at = int(time.time() * 1000)
    if data.is_warmup is not None:
        workout_set.is_warmup = data.is_warmup
    if data.is_dropset is not None:
        workout_set.is_dropset = data.is_dropset
    if data.is_failure is not None:
        workout_set.is_failure = data.is_failure
    
    workout.updated_at = int(time.time() * 1000)
    db.commit()
    db.refresh(workout_set)
    
    return workout_set


def delete_set(
    db: Session,
    user_id: int,
    set_id: int
) -> None:
    """Delete a set from the active workout."""
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    workout_set = db.query(WorkoutSet).join(WorkoutExercise).filter(
        WorkoutSet.id == set_id,
        WorkoutExercise.workout_session_id == workout.id
    ).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set not found in workout"
        )
    
    db.delete(workout_set)
    workout.updated_at = int(time.time() * 1000)
    db.commit()


def finish_workout(
    db: Session,
    user_id: int,
    data: FinishWorkoutRequest
) -> WorkoutSession:
    """
    Finish the active workout.
    Computes analytics, marks as completed, and persists to history.
    Removes exercises with no completed sets before saving.
    """
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    current_time_ms = int(time.time() * 1000)
    
    # Update final name if provided
    if data.workout_name:
        workout.workout_name = data.workout_name
    
    # If no name was ever set, generate one
    if not workout.workout_name:
        from datetime import datetime
        date_str = datetime.fromtimestamp(workout.start_time / 1000).strftime("%b %d, %Y")
        workout.workout_name = f"Workout – {date_str}"
    
    # Remove exercises with no completed sets
    exercises_to_keep = []
    for exercise in workout.workout_exercises:
        has_completed_sets = any(workout_set.completed for workout_set in exercise.workout_sets)
        if has_completed_sets:
            exercises_to_keep.append(exercise)
        else:
            # Delete the exercise and its sets (cascade should handle sets)
            db.delete(exercise)
    
    # Flush to ensure deletions are processed
    db.flush()
    
    # Compute analytics only from exercises with completed sets
    total_volume = 0.0
    total_sets = 0
    total_reps = 0
    exercises_count = len(exercises_to_keep)
    
    for exercise in exercises_to_keep:
        for workout_set in exercise.workout_sets:
            if workout_set.completed:
                total_sets += 1
                try:
                    reps = int(workout_set.reps) if workout_set.reps else 0
                    weight = float(workout_set.weight) if workout_set.weight else 0.0
                    total_reps += reps
                    total_volume += reps * weight
                except (ValueError, TypeError):
                    pass  # Skip invalid values
    
    # Update workout record
    workout.is_active = False
    workout.is_completed = True
    workout.end_time = current_time_ms
    workout.total_volume = total_volume
    workout.total_sets = total_sets
    workout.total_reps = total_reps
    workout.exercises_count = exercises_count
    workout.updated_at = current_time_ms
    
    db.commit()
    db.refresh(workout)
    
    return workout


def cancel_workout(
    db: Session,
    user_id: int
) -> None:
    """
    Cancel and delete the active workout.
    No history is preserved.
    """
    workout = get_active_workout(db, user_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active workout found"
        )
    
    # Simply delete the workout (cascade will remove exercises and sets)
    db.delete(workout)
    db.commit()


def get_workout_history(
    db: Session,
    user_id: int,
    limit: int = 50,
    offset: int = 0
) -> List[WorkoutSession]:
    """Get user's completed workout history."""
    return db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.is_completed == True
    ).order_by(
        WorkoutSession.end_time.desc()
    ).limit(limit).offset(offset).all()


def get_workout_by_id(
    db: Session,
    user_id: int,
    workout_id: int
) -> WorkoutSession:
    """Get a specific workout by ID (must belong to user)."""
    workout = db.query(WorkoutSession).options(
        joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.workout_sets)
    ).filter(
        WorkoutSession.id == workout_id,
        WorkoutSession.user_id == user_id
    ).first()
    
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    
    return workout


def get_workout_stats(db: Session, user_id: int) -> dict:
    """Get user's workout statistics."""
    completed_workouts = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.is_completed == True
    ).all()
    
    total_workouts = len(completed_workouts)
    total_volume = sum(w.total_volume or 0 for w in completed_workouts)
    total_sets = sum(w.total_sets or 0 for w in completed_workouts)
    
    # Calculate current streak (simplified - days with workouts)
    # For production, you'd want more sophisticated streak calculation
    current_streak = 0
    if completed_workouts:
        from datetime import datetime, timedelta
        today = datetime.now().date()
        workout_dates = sorted(
            set(datetime.fromtimestamp(w.start_time / 1000).date() for w in completed_workouts),
            reverse=True
        )
        
        if workout_dates and workout_dates[0] >= today - timedelta(days=1):
            current_streak = 1
            for i in range(1, len(workout_dates)):
                if workout_dates[i] == workout_dates[i-1] - timedelta(days=1):
                    current_streak += 1
                else:
                    break
    
    return {
        "total_workouts": total_workouts,
        "current_streak": current_streak,
        "total_volume": total_volume,
        "total_sets": total_sets
    }
