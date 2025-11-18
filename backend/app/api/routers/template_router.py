from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.schemas.template_schema import (
    WorkoutTemplateCreate,
    WorkoutTemplateUpdate,
    WorkoutTemplateResponse,
)
from app.api.services import template_service
from app.api.services.auth_service import get_current_user
from app.api.schemas.user_schema import UserResponse

from app.api.common.response_types import (
    created_response,
    success_response,
    
)
from app.api.common.response import APIResponse
from app.api.common.exception_responses import standard_responses


router = APIRouter(
    prefix="/templates",
    tags=["Workout Templates"]
)


@router.post(
    "/",
    response_model=APIResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses}
)
def create_template(
    data: WorkoutTemplateCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    created = template_service.create_template(db, owner_id=current_user.id, data=data)
    validated = WorkoutTemplateResponse.model_validate(created)
    return created_response(validated)


@router.get(
    "/",
    response_model=APIResponse,
    responses={**standard_responses}
)
def get_all_templates(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    results = template_service.get_all_templates(db, owner_id=current_user.id)
    validated = [WorkoutTemplateResponse.model_validate(t) for t in results]
    return success_response(validated)


@router.get(
    "/{template_id}",
    response_model=APIResponse,
    responses={**standard_responses}
)
def get_template_by_id(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    template = template_service.get_template_by_id(db, template_id, owner_id=current_user.id)
    if not template:
        raise HTTPException(status_code=404, detail="Workout template not found")

    validated = WorkoutTemplateResponse.model_validate(template)
    return success_response(validated)


@router.put(
    "/{template_id}",
    response_model=APIResponse,
    responses={**standard_responses}
)
def update_template(
    template_id: int,
    data: WorkoutTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    updated = template_service.update_template(db, template_id, owner_id=current_user.id, data=data)
    if not updated:
        raise HTTPException(status_code=404, detail="Workout template not found")

    validated = WorkoutTemplateResponse.model_validate(updated)
    return success_response(validated)


@router.delete(
    "/{template_id}",
    response_model=APIResponse,
    responses={**standard_responses}
)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    deleted = template_service.delete_template(db, template_id, owner_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workout template not found")

    return success_response()
