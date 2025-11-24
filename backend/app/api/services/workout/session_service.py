# app/api/services/workout/session_service.py
"""
Service layer for workout session management.
Follows Single Responsibility Principle - handles only session-level operations.
"""
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from datetime import datetime, timezone
from typing import List, Optional

from app.models.workout_session_model import WorkoutSession, WorkoutStatus
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.template_model import WorkoutTemplate
from app.models.exercise_model import Exercise
from app.api.schemas.workout_schema import WorkoutSessionStart, WorkoutSessionUpdate


def start_workout_session(db: Session, user_id: int, data: WorkoutSessionStart) -> WorkoutSession:
    """
    Start a new workout session.
    Can be empty or loaded from a template.
    """
    # Create the session
    session = WorkoutSession(
        user_id=user_id,
        template_id=data.template_id,
        status=WorkoutStatus.ACTIVE,
        start_time=datetime.now(timezone.utc),
        name=data.name,
        notes=data.notes,
    )
    
    db.add(session)
    db.flush()  # Get session.id
    
    # If template_id is provided, load exercises from the template
    if data.template_id:
        _load_template_into_session(db, session, data.template_id, user_id)
    
    db.commit()
    db.refresh(session)
    
    return session


def get_active_workout(db: Session, user_id: int) -> Optional[WorkoutSession]:
    """Get the user's currently active workout session, if any."""
    session = (
        db.query(WorkoutSession)
        .options(
            joinedload(WorkoutSession.workout_exercises)
            .joinedload(WorkoutExercise.exercise),
            joinedload(WorkoutSession.workout_exercises)
            .joinedload(WorkoutExercise.workout_sets)
        )
        .filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == WorkoutStatus.ACTIVE
        )
        .first()
    )
    
    return session


def get_workout_session_by_id(db: Session, session_id: int, user_id: int) -> WorkoutSession:
    """
    Get a specific workout session by ID with security guard.
    Implements authorization check following security best practices.
    """
    session = (
        db.query(WorkoutSession)
        .options(
            joinedload(WorkoutSession.workout_exercises)
            .joinedload(WorkoutExercise.exercise),
            joinedload(WorkoutSession.workout_exercises)
            .joinedload(WorkoutExercise.workout_sets)
        )
        .filter(WorkoutSession.id == session_id)
        .first()
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout session {session_id} not found"
        )
    
    # Security guard: ensure user owns this session
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this workout session"
        )
    
    return session


def get_all_workout_sessions(
    db: Session, 
    user_id: int, 
    status_filter: Optional[str] = None
) -> List[WorkoutSession]:
    """Get all workout sessions for a user, optionally filtered by status."""
    query = (
        db.query(WorkoutSession)
        .options(
            joinedload(WorkoutSession.workout_exercises)
            .joinedload(WorkoutExercise.exercise),
            joinedload(WorkoutSession.workout_exercises)
            .joinedload(WorkoutExercise.workout_sets)
        )
        .filter(WorkoutSession.user_id == user_id)
    )
    
    if status_filter:
        try:
            status_enum = WorkoutStatus[status_filter.upper()]
            query = query.filter(WorkoutSession.status == status_enum)
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter: {status_filter}"
            )
    
    sessions = query.order_by(WorkoutSession.start_time.desc()).all()
    
    return sessions


def update_workout_session(
    db: Session, 
    session_id: int, 
    user_id: int, 
    data: WorkoutSessionUpdate
) -> WorkoutSession:
    """Update workout session metadata (name, notes)."""
    session = get_workout_session_by_id(db, session_id, user_id)
    
    # Only allow updating active sessions
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a completed or cancelled workout"
        )
    
    if data.name is not None:
        session.name = data.name
    if data.notes is not None:
        session.notes = data.notes
    
    db.commit()
    db.refresh(session)
    
    return session


def finish_workout_session(db: Session, session_id: int, user_id: int) -> WorkoutSession:
    """
    Finish an active workout session.
    - Compute duration
    - Discard empty/invalid sets
    - Calculate analytics (volume, total reps, total sets)
    - Mark as COMPLETED
    """
    from app.api.services.workout.analytics_service import calculate_workout_analytics
    from app.api.services.workout.set_service import validate_and_clean_sets
    
    session = get_workout_session_by_id(db, session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This workout is not active"
        )
    
    # Set end time and calculate duration
    session.end_time = datetime.now(timezone.utc)
    session.duration_seconds = int((session.end_time - session.start_time).total_seconds())
    
    # Clean invalid sets and remove empty exercises
    validate_and_clean_sets(db, session)
    
    # Calculate analytics
    analytics = calculate_workout_analytics(session)
    session.total_volume = analytics['total_volume']
    session.total_reps = analytics['total_reps']
    session.total_sets = analytics['total_sets']
    
    session.status = WorkoutStatus.COMPLETED
    
    db.commit()
    db.refresh(session)
    
    return session


def cancel_workout_session(db: Session, session_id: int, user_id: int) -> WorkoutSession:
    """Cancel an active workout session."""
    session = get_workout_session_by_id(db, session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This workout is not active"
        )
    
    session.status = WorkoutStatus.CANCELLED
    session.end_time = datetime.now(timezone.utc)
    session.duration_seconds = int((session.end_time - session.start_time).total_seconds())
    
    db.commit()
    db.refresh(session)
    
    return session


def delete_workout_session(db: Session, session_id: int, user_id: int) -> None:
    """Permanently delete a workout session."""
    session = get_workout_session_by_id(db, session_id, user_id)
    db.delete(session)
    db.commit()


# ============ Private Helper Functions ============

def _load_template_into_session(
    db: Session, 
    session: WorkoutSession, 
    template_id: int, 
    user_id: int
) -> None:
    """
    Load exercises from template into workout session.
    Private helper function following encapsulation principles.
    """
    template = (
        db.query(WorkoutTemplate)
        .options(joinedload(WorkoutTemplate.template_exercises))
        .filter(WorkoutTemplate.id == template_id)
        .first()
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with ID {template_id} not found"
        )
    
    # STRICT RULE: User can ONLY use their own templates (no public templates allowed)
    if template.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only start workouts from your own templates"
        )
    
    # Copy template exercises to workout session
    for template_ex in template.template_exercises:
        workout_ex = WorkoutExercise(
            workout_session_id=session.id,
            exercise_id=template_ex.exercise_id,
            position=template_ex.position,
            notes=template_ex.notes,
        )
        db.add(workout_ex)
        db.flush()  # Get workout_ex.id
        
        # Create placeholder sets based on template (optional)
        if template_ex.sets and template_ex.sets > 0:
            for set_num in range(1, template_ex.sets + 1):
                workout_set = WorkoutSet(
                    workout_exercise_id=workout_ex.id,
                    set_number=set_num,
                    reps=template_ex.reps,  # Pre-populate from template
                    # Other fields remain None until user logs them
                )
                db.add(workout_set)
