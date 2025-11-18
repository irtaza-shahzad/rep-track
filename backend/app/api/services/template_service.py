from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.template_model import WorkoutTemplate
from app.models.template_exercise_model import TemplateExercise
from app.models.exercise_model import Exercise
from app.api.schemas.template_schema import WorkoutTemplateCreate, WorkoutTemplateUpdate, TemplateExerciseCreate


def create_template(db: Session, owner_id: int, data: WorkoutTemplateCreate):
    # Check if the user already has a template with this name
    existing_template = (
        db.query(WorkoutTemplate)
        .filter(
            WorkoutTemplate.owner_id == owner_id,
            WorkoutTemplate.name == data.name
        )
        .first()
    )
    if existing_template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a template named '{data.name}'. Template names must be unique per user."
        )

    # Create the parent template
    template = WorkoutTemplate(
        owner_id=owner_id,
        name=data.name,
        description=data.description,
        is_public=False,
    )
    db.add(template)
    db.flush()  # Get template.id before inserting exercises

    # Add exercises if provided
    if data.exercises:
        for idx, ex in enumerate(data.exercises):
            # Lookup exercise by ID now
            exercise = db.query(Exercise).filter(Exercise.id == ex.exercise_id).first()
            if not exercise:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Exercise with ID {ex.exercise_id} not found"
                )

            template_exercise = TemplateExercise(
                template_id=template.id,
                exercise_id=exercise.id,
                position=ex.position if ex.position is not None else idx + 1,
                sets=ex.sets,
                reps=ex.reps,
                duration_seconds=ex.duration_seconds,
                rest_seconds=ex.rest_seconds,
                notes=ex.notes
            )
            db.add(template_exercise)

    db.commit()
    db.refresh(template)

    # Add exercise_name dynamically for output
    for te in template.template_exercises:
        exercise = db.query(Exercise).filter(Exercise.id == te.exercise_id).first()
        if exercise:
            te.exercise_name = exercise.name

    return template


def get_all_templates(db: Session, owner_id: int):
    templates = db.query(WorkoutTemplate).filter(WorkoutTemplate.owner_id == owner_id).all()

    for template in templates:
        for te in template.template_exercises:
            te.exercise_name = te.exercise.name if getattr(te, "exercise", None) else None

    return templates


def get_template_by_id(db: Session, template_id: int, owner_id: int):
    template = db.query(WorkoutTemplate).filter(
        WorkoutTemplate.id == template_id,
        WorkoutTemplate.owner_id == owner_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    for te in template.template_exercises:
        te.exercise_name = te.exercise.name if getattr(te, "exercise", None) else None

    return template


def update_template(db: Session, template_id: int, owner_id: int, data: WorkoutTemplateUpdate):
    template = get_template_by_id(db, template_id, owner_id)

    # Update name and description if provided
    if data.name is not None:
        existing_template = (
            db.query(WorkoutTemplate)
            .filter(
                WorkoutTemplate.owner_id == owner_id,
                WorkoutTemplate.name == data.name,
                WorkoutTemplate.id != template_id
            )
            .first()
        )
        if existing_template:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You already have another template named '{data.name}'."
            )
        template.name = data.name

    if data.description is not None:
        template.description = data.description

    if data.exercises is not None:
        existing_exercises = {ex.id: ex for ex in template.template_exercises}

        for ex_data in data.exercises:
            # Update existing exercise
            if hasattr(ex_data, "id") and ex_data.id and ex_data.id in existing_exercises:
                tempexercise = existing_exercises[ex_data.id]

                if ex_data.exercise_id:
                    exercise = db.query(Exercise).filter(Exercise.id == ex_data.exercise_id).first()
                    if not exercise:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Exercise with ID {ex_data.exercise_id} not found"
                        )
                    tempexercise.exercise_id = exercise.id

                for field, value in ex_data.dict(exclude_unset=True).items():
                    if field not in ("id", "exercise_id"):
                        setattr(tempexercise, field, value)

            # Add new exercise
            else:
                if not ex_data.exercise_id:
                    raise HTTPException(
                        status_code=400,
                        detail="New exercises must include 'exercise_id'"
                    )

                exercise = db.query(Exercise).filter(Exercise.id == ex_data.exercise_id).first()
                if not exercise:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Exercise with ID {ex_data.exercise_id} not found"
                    )

                new_ex = TemplateExercise(
                    template_id=template.id,
                    exercise_id=exercise.id,
                    position=ex_data.position,
                    sets=ex_data.sets,
                    reps=ex_data.reps,
                    duration_seconds=ex_data.duration_seconds,
                    rest_seconds=ex_data.rest_seconds,
                    notes=ex_data.notes
                )
                db.add(new_ex)

        existing_ids = {ex.id for ex in data.exercises if hasattr(ex, "id") and ex.id}
        for ex_id in list(existing_exercises.keys()):
            if ex_id not in existing_ids:
                db.delete(existing_exercises[ex_id])

    db.commit()
    db.refresh(template)

    for tempexercise in template.template_exercises:
        exercise = db.query(Exercise).filter(Exercise.id == tempexercise.exercise_id).first()
        tempexercise.exercise_name = exercise.name if exercise else None

    return template


def delete_template(db: Session, template_id: int, owner_id: int):
    template = get_template_by_id(db, template_id, owner_id)
    db.delete(template)
    db.commit()
    return {"detail": "Template deleted successfully"}
