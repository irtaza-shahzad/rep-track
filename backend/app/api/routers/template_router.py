# app/api/routers/template_router.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.schemas.template_schema import (
    WorkoutTemplateCreate,
    WorkoutTemplateOut,
    WorkoutTemplateUpdate,
)
from app.api.services import template_service
from app.api.services.auth_service import get_current_user  # assuming you already have this from auth
from app.api.schemas.user_schema import UserResponse  # for type hinting of current_user


router = APIRouter(
    prefix="/templates",
    tags=["Workout Templates"]
)


# ─────────────────────────────────────────────────────────────
# Create a new workout template
# ─────────────────────────────────────────────────────────────
@router.post("/", response_model=WorkoutTemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    data: WorkoutTemplateCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return template_service.create_template(db, owner_id=current_user.id, data=data)


# ─────────────────────────────────────────────────────────────
# Get all templates (user’s own)
# ─────────────────────────────────────────────────────────────
@router.get("/", response_model=List[WorkoutTemplateOut])
def get_all_templates(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return template_service.get_all_templates(db, owner_id=current_user.id)


# ─────────────────────────────────────────────────────────────
# Get a specific template by ID
# ─────────────────────────────────────────────────────────────
@router.get("/{template_id}", response_model=WorkoutTemplateOut)
def get_template_by_id(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return template_service.get_template_by_id(db, template_id, owner_id=current_user.id)


# ─────────────────────────────────────────────────────────────
# Update a template
# ─────────────────────────────────────────────────────────────
@router.put("/{template_id}", response_model=WorkoutTemplateOut)
def update_template(
    template_id: int,
    data: WorkoutTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return template_service.update_template(db, template_id, owner_id=current_user.id, data=data)


# ─────────────────────────────────────────────────────────────
# Delete a template
# ─────────────────────────────────────────────────────────────
@router.delete("/{template_id}", status_code=status.HTTP_200_OK)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    return template_service.delete_template(db, template_id, owner_id=current_user.id)