# app/api/services/workout_service.py
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from datetime import datetime, timezone
from typing import List, Optional

from app.models.workout_session_model import WorkoutSession, WorkoutStatus
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.template_model import WorkoutTemplate
from app.models.exercise_model import Exercise
from app.api.schemas.workout_schema import (
    WorkoutSessionStart,
    WorkoutSessionUpdate,
    WorkoutExerciseCreate,
    WorkoutExerciseUpdate,
    WorkoutSetCreate,
    WorkoutSetUpdate,
)


# ============ Session Management ============

def start_workout_session(db: Session, user_id: int, data: WorkoutSessionStart) -> WorkoutSession:
    """
    Start a new workout session.
    Can be empty or loaded from a template.
    """
    # Check if user already has an active workout
    active_workout = get_active_workout(db, user_id)
    if active_workout:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active workout (ID: {active_workout.id}). Please finish or cancel it before starting a new one."
        )
    
    # Set default name if not provided
    workout_name = data.name if data.name else "Workout"
    
    # Create the session
    session = WorkoutSession(
        user_id=user_id,
        template_id=data.template_id,
        status=WorkoutStatus.ACTIVE,
        start_time=datetime.now(timezone.utc),
        name=workout_name,
        notes=data.notes,
    )
    
    db.add(session)
    db.flush()  # Get session.id
    
    # If template_id is provided, load exercises from the template
    if data.template_id:
        template = (
            db.query(WorkoutTemplate)
            .options(joinedload(WorkoutTemplate.template_exercises))
            .filter(WorkoutTemplate.id == data.template_id)
            .first()
        )
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {data.template_id} not found"
            )
        
        # Verify user owns the template or it's public
        if template.owner_id != user_id and not template.is_public:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this template"
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
            # Note: Sets are created empty - user must log actual data during workout
            if template_ex.sets and template_ex.sets > 0:
                for set_num in range(1, template_ex.sets + 1):
                    workout_set = WorkoutSet(
                        workout_exercise_id=workout_ex.id,
                        set_number=set_num,
                        # Leave reps, weight, etc. as None - user fills during workout
                        is_completed=False  # Must be explicitly completed
                    )
                    db.add(workout_set)
    
    db.commit()
    db.refresh(session)
    
    # Populate exercise names
    _populate_exercise_names(db, session)
    
    return session


def get_active_workout(db: Session, user_id: int) -> Optional[WorkoutSession]:
    """Get the user's currently active workout session, if any."""
    session = (
        db.query(WorkoutSession)
        .options(
            joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.workout_sets)
        )
        .filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == WorkoutStatus.ACTIVE
        )
        .first()
    )
    
    if session:
        _populate_exercise_names(db, session)
    
    return session


def get_workout_session_by_id(db: Session, session_id: int, user_id: int) -> WorkoutSession:
    """Get a specific workout session by ID with security guard."""
    session = (
        db.query(WorkoutSession)
        .options(
            joinedload(WorkoutSession.workout_exercises).joinedload(WorkoutExercise.workout_sets)
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
    
    _populate_exercise_names(db, session)
    
    return session


def get_all_workout_sessions(db: Session, user_id: int, status_filter: Optional[str] = None) -> List[WorkoutSession]:
    """Get all workout sessions for a user, optionally filtered by status."""
    query = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id)
    
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
    
    # Load relationships and populate names
    for session in sessions:
        db.refresh(session)
        _populate_exercise_names(db, session)
    
    return sessions


def update_workout_session(db: Session, session_id: int, user_id: int, data: WorkoutSessionUpdate) -> WorkoutSession:
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
    _populate_exercise_names(db, session)
    
    return session


def finish_workout_session(db: Session, session_id: int, user_id: int) -> WorkoutSession:
    """
    Finish an active workout session.
    - Compute duration
    - Discard empty/invalid sets
    - Calculate analytics (volume, total reps, total sets)
    - Mark as COMPLETED
    """
    session = get_workout_session_by_id(db, session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This workout is not active"
        )
    
    # Set end time and calculate duration
    session.end_time = datetime.now(timezone.utc)
    session.duration_seconds = int((session.end_time - session.start_time).total_seconds())
    
    # Process each exercise and remove incomplete/invalid sets
    # Per spec: Only completed sets count toward totals
    total_volume = 0.0
    total_reps = 0
    total_sets = 0
    
    for workout_ex in session.workout_exercises:
        sets_to_keep = []
        
        for workout_set in workout_ex.workout_sets:
            # A set is valid ONLY if:
            # 1. It's marked as completed (is_completed=True), AND
            # 2. It has at least weight+reps OR duration OR distance
            has_data = (
                (workout_set.weight is not None and workout_set.reps is not None) or
                (workout_set.duration_seconds is not None) or
                (workout_set.distance is not None)
            )
            
            is_valid = workout_set.is_completed and has_data
            
            if is_valid:
                sets_to_keep.append(workout_set)
                
                # Calculate volume (weight * reps) - exclude warmup sets optionally
                if workout_set.weight is not None and workout_set.reps is not None:
                    total_volume += workout_set.weight * workout_set.reps
                    total_reps += workout_set.reps
                
                total_sets += 1
            else:
                # Delete incomplete/invalid set
                db.delete(workout_set)
        
        # Update the workout_sets list to only include valid sets
        workout_ex.workout_sets = sets_to_keep
        
        # If an exercise has no valid sets, optionally remove it
        if not sets_to_keep:
            db.delete(workout_ex)
    
    # Count remaining exercises after cleanup
    exercises_count = len([ex for ex in session.workout_exercises if ex.workout_sets])
    
    # Validate at least one completed set exists
    if total_sets == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot finish workout with no completed sets"
        )
    
    # Update analytics fields
    session.total_volume = total_volume
    session.total_reps = total_reps
    session.total_sets = total_sets
    session.status = WorkoutStatus.COMPLETED
    
    db.commit()
    db.refresh(session)
    _populate_exercise_names(db, session)
    
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
    _populate_exercise_names(db, session)
    
    return session


def delete_workout_session(db: Session, session_id: int, user_id: int) -> None:
    """Permanently delete a workout session."""
    session = get_workout_session_by_id(db, session_id, user_id)
    
    db.delete(session)
    db.commit()


# ============ Exercise Management Within Session ============

def add_exercise_to_session(db: Session, session_id: int, user_id: int, data: WorkoutExerciseCreate) -> WorkoutExercise:
    """Add an exercise to an active workout session."""
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
    
    # Auto-calculate position if not provided
    position = data.position
    if position is None or position == 0:
        # Get the max position and add 1
        max_position = db.query(WorkoutExercise.position).filter(
            WorkoutExercise.workout_session_id == session_id
        ).order_by(WorkoutExercise.position.desc()).first()
        position = (max_position[0] + 1) if max_position and max_position[0] else 1
    
    # Create workout exercise
    workout_ex = WorkoutExercise(
        workout_session_id=session_id,
        exercise_id=data.exercise_id,
        position=position,
        notes=data.notes,
    )
    
    db.add(workout_ex)
    db.commit()
    db.refresh(workout_ex)
    
    # Populate exercise name
    workout_ex.exercise_name = exercise.name
    
    return workout_ex


def update_workout_exercise(db: Session, workout_exercise_id: int, user_id: int, data: WorkoutExerciseUpdate) -> WorkoutExercise:
    """Update a workout exercise (position, notes)."""
    workout_ex = db.query(WorkoutExercise).filter(WorkoutExercise.id == workout_exercise_id).first()
    
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


def remove_exercise_from_session(db: Session, workout_exercise_id: int, user_id: int) -> None:
    """Remove an exercise from an active workout session."""
    workout_ex = db.query(WorkoutExercise).filter(WorkoutExercise.id == workout_exercise_id).first()
    
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


def reorder_exercises(db: Session, session_id: int, user_id: int, exercise_positions: List[dict]) -> WorkoutSession:
    """Reorder exercises within a workout session."""
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
    _populate_exercise_names(db, session)
    
    return session


# ============ Set Management ============

def add_set_to_exercise(db: Session, workout_exercise_id: int, user_id: int, data: WorkoutSetCreate) -> WorkoutSet:
    """Add a set to a workout exercise."""
    workout_ex = db.query(WorkoutExercise).filter(WorkoutExercise.id == workout_exercise_id).first()
    
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
    
    # Auto-calculate set_number if not provided or is 0
    set_number = data.set_number
    if set_number is None or set_number == 0:
        # Get the max set_number for this exercise and add 1
        max_set = db.query(WorkoutSet.set_number).filter(
            WorkoutSet.workout_exercise_id == workout_exercise_id
        ).order_by(WorkoutSet.set_number.desc()).first()
        set_number = (max_set[0] + 1) if max_set and max_set[0] else 1
    
    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise_id,
        set_number=set_number,
        weight=data.weight,
        reps=data.reps,
        duration_seconds=data.duration_seconds,
        distance=data.distance,
        rpe=data.rpe,
        notes=data.notes,
        is_completed=data.is_completed,  # Track completion status
        is_warmup=data.is_warmup,
        is_dropset=data.is_dropset,
        is_failure=data.is_failure,
    )
    
    # If marked as completed and has valid data, set completed_at timestamp
    if data.is_completed:
        has_valid_data = (
            (data.weight is not None and data.reps is not None) or
            (data.duration_seconds is not None) or
            (data.distance is not None)
        )
        if has_valid_data:
            workout_set.completed_at = datetime.now(timezone.utc)
    
    db.add(workout_set)
    db.commit()
    db.refresh(workout_set)
    
    return workout_set


def update_set(db: Session, set_id: int, user_id: int, data: WorkoutSetUpdate) -> WorkoutSet:
    """Update a workout set."""
    workout_set = db.query(WorkoutSet).filter(WorkoutSet.id == set_id).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout set {set_id} not found"
        )
    
    # Security guard via exercise -> session
    workout_ex = db.query(WorkoutExercise).filter(WorkoutExercise.id == workout_set.workout_exercise_id).first()
    if not workout_ex:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout exercise not found")
    
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
    
    # Handle completion tracking
    # If marking as completed for the first time, validate and set timestamp
    if data.is_completed and not workout_set.is_completed:
        has_valid_data = (
            (workout_set.weight is not None and workout_set.reps is not None) or
            (workout_set.duration_seconds is not None) or
            (workout_set.distance is not None)
        )
        if has_valid_data:
            workout_set.is_completed = True
            workout_set.completed_at = datetime.now(timezone.utc)
        else:
            # Cannot mark as complete without valid data
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot complete set without weight+reps, duration, or distance"
            )
    elif not data.is_completed and workout_set.is_completed:
        # Allow un-completing a set (edge case)
        workout_set.is_completed = False
        workout_set.completed_at = None
    
    workout_set.is_warmup = data.is_warmup
    workout_set.is_dropset = data.is_dropset
    workout_set.is_failure = data.is_failure
    
    db.commit()
    db.refresh(workout_set)
    
    return workout_set


def delete_set(db: Session, set_id: int, user_id: int) -> None:
    """Delete a workout set."""
    workout_set = db.query(WorkoutSet).filter(WorkoutSet.id == set_id).first()
    
    if not workout_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout set {set_id} not found"
        )
    
    # Security guard via exercise -> session
    workout_ex = db.query(WorkoutExercise).filter(WorkoutExercise.id == workout_set.workout_exercise_id).first()
    if not workout_ex:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout exercise not found")
    
    session = get_workout_session_by_id(db, workout_ex.workout_session_id, user_id)
    
    if session.status != WorkoutStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify a completed or cancelled workout"
        )
    
    db.delete(workout_set)
    db.commit()


# ============ Helper Functions ============

def _populate_exercise_names(db: Session, session: WorkoutSession) -> None:
    """Populate exercise_name attribute on all WorkoutExercise objects in a session."""
    for workout_ex in session.workout_exercises:
        exercise = db.query(Exercise).filter(Exercise.id == workout_ex.exercise_id).first()
        if exercise:
            workout_ex.exercise_name = exercise.name
        else:
            workout_ex.exercise_name = None
