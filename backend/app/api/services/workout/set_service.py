# app/api/services/workout/set_service.py
"""
Service layer for managing sets within workout exercises.
Follows Single Responsibility Principle - handles only set-level operations.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.workout_set_model import WorkoutSet
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_session_model import WorkoutSession, WorkoutStatus
from app.api.schemas.workout_schema import WorkoutSetCreate, WorkoutSetUpdate


def add_set_to_exercise(
    db: Session, 
    workout_exercise_id: int, 
    user_id: int, 
    data: WorkoutSetCreate
) -> WorkoutSet:
    """Add a set to a workout exercise."""
    from app.api.services.workout.session_service import get_workout_session_by_id
    
    workout_ex = db.query(WorkoutExercise).filter(
        WorkoutExercise.id == workout_exercise_id
    ).first()
    
    if not workout_ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout exercise {workout_exercise_id} not found"
        )
    
    # Security guard via session
    session = get_workout_session_by_id(db, workout_ex.workout_session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a completed or cancelled workout"
        )
    
    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise_id,
        set_number=data.set_number,
        weight=data.weight,
        reps=data.reps,
        duration_seconds=data.duration_seconds,
        distance=data.distance,
        rpe=data.rpe,
        notes=data.notes,
        is_warmup=data.is_warmup,
        is_dropset=data.is_dropset,
        is_failure=data.is_failure,
    )
    
    db.add(workout_set)
    db.commit()
    db.refresh(workout_set)
    
    return workout_set


def update_set(
    db: Session, 
    set_id: int, 
    user_id: int, 
    data: WorkoutSetUpdate
) -> WorkoutSet:
    """Update a workout set."""
    from app.api.services.workout.session_service import get_workout_session_by_id
    
    workout_set = db.query(WorkoutSet).filter(WorkoutSet.id == set_id).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout set {set_id} not found"
        )
    
    # Security guard via exercise -> session
    workout_ex = db.query(WorkoutExercise).filter(
        WorkoutExercise.id == workout_set.workout_exercise_id
    ).first()
    if not workout_ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout exercise not found"
        )
    
    session = get_workout_session_by_id(db, workout_ex.workout_session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a completed or cancelled workout"
        )
    
    # Update fields
    if data.set_number is not None:
        workout_set.set_number = data.set_number
    if data.weight is not None:
        workout_set.weight = data.weight
    if data.reps is not None:
        workout_set.reps = data.reps
    if data.duration_seconds is not None:
        workout_set.duration_seconds = data.duration_seconds
    if data.distance is not None:
        workout_set.distance = data.distance
    if data.rpe is not None:
        workout_set.rpe = data.rpe
    if data.notes is not None:
        workout_set.notes = data.notes
    
    workout_set.is_warmup = data.is_warmup
    workout_set.is_dropset = data.is_dropset
    workout_set.is_failure = data.is_failure
    
    db.commit()
    db.refresh(workout_set)
    
    return workout_set


def delete_set(db: Session, set_id: int, user_id: int) -> None:
    """Delete a workout set."""
    from app.api.services.workout.session_service import get_workout_session_by_id
    
    workout_set = db.query(WorkoutSet).filter(WorkoutSet.id == set_id).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout set {set_id} not found"
        )
    
    # Security guard via exercise -> session
    workout_ex = db.query(WorkoutExercise).filter(
        WorkoutExercise.id == workout_set.workout_exercise_id
    ).first()
    if not workout_ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Workout exercise not found"
        )
    
    session = get_workout_session_by_id(db, workout_ex.workout_session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a completed or cancelled workout"
        )
    
    db.delete(workout_set)
    db.commit()


def validate_and_clean_sets(db: Session, session: WorkoutSession) -> None:
    """
    Validate and remove invalid/empty sets from a workout session.
    Called when finishing a workout.
    
    A set is valid if it has at least:
    - (weight AND reps) OR duration_seconds OR distance
    """
    for workout_ex in session.workout_exercises:
        sets_to_keep = []
        
        for workout_set in workout_ex.workout_sets:
            # A set is valid if it has meaningful data
            is_valid = (
                (workout_set.weight is not None and workout_set.reps is not None) or
                (workout_set.duration_seconds is not None) or
                (workout_set.distance is not None)
            )
            
            if is_valid:
                sets_to_keep.append(workout_set)
            else:
                # Delete invalid set
                db.delete(workout_set)
        
        # Update the workout_sets list to only include valid sets
        workout_ex.workout_sets = sets_to_keep
        
        # If an exercise has no valid sets, remove it
        if not sets_to_keep:
            db.delete(workout_ex)
