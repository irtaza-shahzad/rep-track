from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.exercise_model import Exercise
from app.models.user_model import User
from app.api.schemas.exercise_schema import ExerciseCreate, ExerciseUpdate

def create_exercise(db: Session, exercise: ExerciseCreate, user_id: int | None = None) -> Exercise:
    """
    Creates a new exercise.
    - If an exercise with the same name already exists (global or for this user), throw a conflict error.
    - Otherwise, create a new exercise.
    - If a user_id is provided (user-added exercise), link it to that user.
    """
    existing_exercise = (
        db.query(Exercise)
        .filter(Exercise.name == exercise.name)
        .filter((Exercise.user_id == None) | (Exercise.user_id == user_id))
        .first()
    )
    if existing_exercise:
        raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Exercise.name already exists",
            )
        
    if user_id is not None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

    new_exercise = Exercise(
        name=exercise.name,
        description=exercise.description,
        category=exercise.category.value if hasattr(exercise.category, "value") else exercise.category,
        difficulty=exercise.difficulty.value if hasattr(exercise.difficulty, "value") else exercise.difficulty,
        muscle_group=exercise.muscle_group.value if hasattr(exercise.muscle_group, "value") else exercise.muscle_group,
        user_id=user_id,
    )

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)
    return new_exercise

def get_all_exercises(db: Session, user_id: int) -> list[Exercise]:
    """
    Get all exercises that are either:
    - Global (user_id is NULL)
    - Belong to this user
    """
    exercises = (
        db.query(Exercise)
        .filter((Exercise.user_id == None) | (Exercise.user_id == user_id))
        .all()
    )
    if not exercises:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No exercises found for this user or globally",
        )
    return exercises

def get_exercise_by_id(db: Session, exercise_id: int, user_id: int) -> Exercise:
    """
    Fetch exercise if it’s global or owned by this user.
    """
    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == exercise_id)
        .filter((Exercise.user_id == None) | (Exercise.user_id == user_id))
        .first()
    )
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found or not accessible",
        )
    return exercise

def update_exercise(db: Session, exercise_id: int, payload: ExerciseUpdate, user_id: int) -> Exercise:
    """
    Update exercise only if the user owns it (cannot edit global ones).
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found",
        )

    if exercise.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update global exercises",
        )

    if exercise.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own exercises",
        )

    if payload.description is not None:
        exercise.description = payload.description
    if payload.category is not None:
        exercise.category = payload.category.value if hasattr(payload.category, "value") else payload.category
    if payload.difficulty is not None:
        exercise.difficulty = payload.difficulty.value if hasattr(payload.difficulty, "value") else payload.difficulty
    if payload.muscle_group is not None:
        exercise.muscle_group = payload.muscle_group.value if hasattr(payload.muscle_group, "value") else payload.muscle_group

    db.commit()
    db.refresh(exercise)
    return exercise

def delete_exercise(db: Session, exercise_id: int, user_id: int) -> bool:
    """
    Delete exercise only if the user owns it (cannot delete global ones).
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with ID {exercise_id} not found",
        )

    if exercise.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete global exercises",
        )

    if exercise.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own exercises",
        )

    db.delete(exercise)
    db.commit()
    return True
