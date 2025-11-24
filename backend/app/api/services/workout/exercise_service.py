# app/api/services/workout/exercise_service.py
"""
Service layer for managing exercises within workout sessions.
Follows Single Responsibility Principle - handles only exercise-level operations.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List

from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_session_model import WorkoutSession, WorkoutStatus
from app.models.exercise_model import Exercise
from app.api.schemas.workout_schema import WorkoutExerciseCreate, WorkoutExerciseUpdate


def add_exercise_to_session(
    db: Session, 
    session_id: int, 
    user_id: int, 
    data: WorkoutExerciseCreate
) -> WorkoutExercise:
    """Add an exercise to an active workout session."""
    from app.api.services.workout.session_service import get_workout_session_by_id
    
    session = get_workout_session_by_id(db, session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a completed or cancelled workout"
        )
    
    # Verify exercise exists
    exercise = db.query(Exercise).filter(Exercise.id == data.exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {data.exercise_id} not found"
        )
    
    # Create workout exercise
    workout_ex = WorkoutExercise(
        workout_session_id=session_id,
        exercise_id=data.exercise_id,
        position=data.position,
        notes=data.notes,
    )
    
    db.add(workout_ex)
    db.commit()
    db.refresh(workout_ex)
    
    # Populate exercise name
    workout_ex.exercise_name = exercise.name
    
    return workout_ex


def update_workout_exercise(
    db: Session, 
    workout_exercise_id: int, 
    user_id: int, 
    data: WorkoutExerciseUpdate
) -> WorkoutExercise:
    """Update a workout exercise (position, notes)."""
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
    
    if data.position is not None:
        workout_ex.position = data.position
    if data.notes is not None:
        workout_ex.notes = data.notes
    
    db.commit()
    db.refresh(workout_ex)
    
    # Populate exercise name
    exercise = db.query(Exercise).filter(Exercise.id == workout_ex.exercise_id).first()
    if exercise:
        workout_ex.exercise_name = exercise.name
    
    return workout_ex


def remove_exercise_from_session(
    db: Session, 
    workout_exercise_id: int, 
    user_id: int
) -> None:
    """Remove an exercise from an active workout session."""
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
    
    db.delete(workout_ex)
    db.commit()


def reorder_exercises(
    db: Session, 
    session_id: int, 
    user_id: int, 
    exercise_positions: List[dict]
) -> WorkoutSession:
    """Reorder exercises within a workout session."""
    from app.api.services.workout.session_service import get_workout_session_by_id
    
    session = get_workout_session_by_id(db, session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a completed or cancelled workout"
        )
    
    # Update positions
    for item in exercise_positions:
        workout_exercise_id = item.get("workout_exercise_id")
        new_position = item.get("position")
        
        if workout_exercise_id is None or new_position is None:
            continue
        
        workout_ex = db.query(WorkoutExercise).filter(
            WorkoutExercise.id == workout_exercise_id,
            WorkoutExercise.workout_session_id == session_id
        ).first()
        
        if workout_ex:
            workout_ex.position = new_position
    
    db.commit()
    db.refresh(session)
    
    # Populate exercise names
    from app.api.services.workout.session_service import _populate_exercise_names
    _populate_exercise_names(db, session)
    
    return session
