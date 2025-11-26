# app/api/services/live_workout_service.py
"""
Clean implementation of live workout service.
Handles CRUD operations for active workout sessions.
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
from app.models.exercise_model import Exercise
from app.api.schemas.workout_schema import (
    StartWorkoutRequest,
    UpdateWorkoutRequest,
    ExerciseCreate,
    WorkoutSetCreate,
    WorkoutSetUpdate,
)


# ============ Workout Session Operations ============

def start_workout(
    db: Session,
    user_id: int,
    data: StartWorkoutRequest
) -> WorkoutSession:
    """
    Start a new workout session.
    Can start empty or from a user's own template.
    """
    # Check if user already has an active workout
    existing = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active workout. Please finish or cancel it first."
        )
    
    # If template_id provided, verify it belongs to the user
    template = None
    if data.template_id:
        template = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == data.template_id,
            WorkoutTemplate.user_id == user_id
        ).first()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Template not found or you don't have access to it"
            )
    
    # Get next workout number for this user
    max_number = db.query(func.max(WorkoutSession.workout_number)).filter(
        WorkoutSession.user_id == user_id
    ).scalar() or 0
    
    workout_number = max_number + 1
    start_time_ms = int(time.time() * 1000)
    
    # Create workout session
    workout = WorkoutSession(
        user_id=user_id,
        template_id=data.template_id,
        workout_number=workout_number,
        workout_name=data.workout_name or "",
        start_time=start_time_ms,
        is_paused=False,
        is_active=True
    )
    
    db.add(workout)
    db.flush()  # Get workout.id
    
    # If starting from template, copy exercises
    if template:
        template_exercises = db.query(TemplateExercise).filter(
            TemplateExercise.template_id == template.id
        ).order_by(TemplateExercise.position).all()
        
        for idx, te in enumerate(template_exercises):
            workout_ex = WorkoutExercise(
                workout_session_id=workout.id,
                exercise_id=te.exercise_id,
                position=idx
            )
            db.add(workout_ex)
            db.flush()
            
            # Copy sets from template
            for set_idx, ts in enumerate(te.template_sets):
                workout_set = WorkoutSet(
                    workout_exercise_id=workout_ex.id,
                    position=set_idx,
                    reps=str(ts.target_reps) if ts.target_reps else "",
                    weight=str(ts.target_weight) if ts.target_weight else "",
                    completed=False,
                    is_warmup=False,
                    is_dropset=False,
                    is_failure=False
                )
                db.add(workout_set)
    
    db.commit()
    db.refresh(workout)
    
    # Load relationships
    workout = db.query(WorkoutSession).options(
        joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.exercise),
        joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.workout_sets)
    ).filter(WorkoutSession.id == workout.id).first()
    
    return workout


def get_active_workout(db: Session, user_id: int) -> Optional[WorkoutSession]:
    """Get the user's currently active workout, if any."""
    workout = db.query(WorkoutSession).options(
        joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.exercise),
        joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.workout_sets)
    ).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.is_active == True
    ).first()
    
    return workout


def get_workout_by_id(db: Session, workout_id: int, user_id: int) -> WorkoutSession:
    """Get a specific workout by ID with auth check."""
    workout = db.query(WorkoutSession).options(
        joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.exercise),
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


def update_workout(
    db: Session,
    workout_id: int,
    user_id: int,
    data: UpdateWorkoutRequest
) -> WorkoutSession:
    """Update workout metadata (name, pause state)."""
    workout = get_workout_by_id(db, workout_id, user_id)
    
    if not workout.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a finished workout"
        )
    
    if data.workout_name is not None:
        workout.workout_name = data.workout_name
    
    if data.is_paused is not None:
        workout.is_paused = data.is_paused
    
    db.commit()
    db.refresh(workout)
    
    return workout


def finish_workout(db: Session, workout_id: int, user_id: int) -> WorkoutSession:
    """
    Finish an active workout.
    Marks it as inactive and returns final state.
    """
    workout = get_workout_by_id(db, workout_id, user_id)
    
    if not workout.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workout is already finished"
        )
    
    workout.is_active = False
    workout.is_paused = False
    
    db.commit()
    db.refresh(workout)
    
    return workout


def cancel_workout(db: Session, workout_id: int, user_id: int) -> None:
    """Cancel/delete an active workout."""
    workout = get_workout_by_id(db, workout_id, user_id)
    
    if not workout.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a finished workout"
        )
    
    db.delete(workout)
    db.commit()


# ============ Exercise Operations ============

def add_exercise(
    db: Session,
    workout_id: int,
    user_id: int,
    data: ExerciseCreate
) -> WorkoutExercise:
    """Add an exercise to an active workout."""
    workout = get_workout_by_id(db, workout_id, user_id)
    
    if not workout.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a finished workout"
        )
    
    # Verify exercise exists
    exercise = db.query(Exercise).filter(Exercise.id == data.exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found"
        )
    
    # Determine position
    if data.position is not None:
        position = data.position
    else:
        max_pos = db.query(func.max(WorkoutExercise.position)).filter(
            WorkoutExercise.workout_session_id == workout_id
        ).scalar() or -1
        position = max_pos + 1
    
    workout_ex = WorkoutExercise(
        workout_session_id=workout_id,
        exercise_id=data.exercise_id,
        position=position
    )
    
    db.add(workout_ex)
    db.commit()
    db.refresh(workout_ex)
    
    # Load relationships
    workout_ex = db.query(WorkoutExercise).options(
        joinedload(WorkoutExercise.exercise),
        joinedload(WorkoutExercise.workout_sets)
    ).filter(WorkoutExercise.id == workout_ex.id).first()
    
    return workout_ex


def remove_exercise(
    db: Session,
    workout_exercise_id: int,
    user_id: int
) -> None:
    """Remove an exercise from an active workout."""
    workout_ex = db.query(WorkoutExercise).options(
        joinedload(WorkoutExercise.workout_session)
    ).filter(WorkoutExercise.id == workout_exercise_id).first()
    
    if not workout_ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in workout"
        )
    
    if workout_ex.workout_session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if not workout_ex.workout_session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a finished workout"
        )
    
    db.delete(workout_ex)
    db.commit()


def reorder_exercises(
    db: Session,
    workout_id: int,
    user_id: int,
    exercise_ids: List[int]
) -> WorkoutSession:
    """Reorder exercises in a workout."""
    workout = get_workout_by_id(db, workout_id, user_id)
    
    if not workout.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a finished workout"
        )
    
    # Update positions
    for new_position, exercise_id in enumerate(exercise_ids):
        workout_ex = db.query(WorkoutExercise).filter(
            WorkoutExercise.id == exercise_id,
            WorkoutExercise.workout_session_id == workout_id
        ).first()
        
        if workout_ex:
            workout_ex.position = new_position
    
    db.commit()
    db.refresh(workout)
    
    return workout


# ============ Set Operations ============

def add_set(
    db: Session,
    workout_exercise_id: int,
    user_id: int,
    data: WorkoutSetCreate
) -> WorkoutSet:
    """Add a set to an exercise in an active workout."""
    workout_ex = db.query(WorkoutExercise).options(
        joinedload(WorkoutExercise.workout_session)
    ).filter(WorkoutExercise.id == workout_exercise_id).first()
    
    if not workout_ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found in workout"
        )
    
    if workout_ex.workout_session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if not workout_ex.workout_session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a finished workout"
        )
    
    # Get next position
    max_pos = db.query(func.max(WorkoutSet.position)).filter(
        WorkoutSet.workout_exercise_id == workout_exercise_id
    ).scalar()
    
    position = 0 if max_pos is None else max_pos + 1
    
    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise_id,
        position=position,
        reps=data.reps,
        weight=data.weight,
        rpe=data.rpe,
        completed=data.completed,
        is_warmup=data.isWarmup,
        is_dropset=data.isDropset,
        is_failure=data.isFailure
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
    """Update a set in an active workout."""
    workout_set = db.query(WorkoutSet).options(
        joinedload(WorkoutSet.workout_exercise).joinedload(WorkoutExercise.workout_session)
    ).filter(WorkoutSet.id == set_id).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set not found"
        )
    
    if workout_set.workout_exercise.workout_session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if not workout_set.workout_exercise.workout_session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a finished workout"
        )
    
    # Update fields
    workout_set.reps = data.reps
    workout_set.weight = data.weight
    workout_set.rpe = data.rpe
    workout_set.completed = data.completed
    workout_set.is_warmup = data.isWarmup
    workout_set.is_dropset = data.isDropset
    workout_set.is_failure = data.isFailure
    
    db.commit()
    db.refresh(workout_set)
    
    return workout_set


def remove_set(
    db: Session,
    set_id: int,
    user_id: int
) -> None:
    """Remove a set from an active workout."""
    workout_set = db.query(WorkoutSet).options(
        joinedload(WorkoutSet.workout_exercise).joinedload(WorkoutExercise.workout_session)
    ).filter(WorkoutSet.id == set_id).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Set not found"
        )
    
    if workout_set.workout_exercise.workout_session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if not workout_set.workout_exercise.workout_session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a finished workout"
        )
    
    db.delete(workout_set)
    db.commit()
