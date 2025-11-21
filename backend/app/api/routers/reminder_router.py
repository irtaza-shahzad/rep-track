from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.schemas.reminder_schema import ReminderResponse, ReminderCreate, ReminderUpdate
from app.api.services import reminder_service
from app.core.security.dependencies import verify_jwt
from app.api.common.response import APIResponse
from app.api.common.response_types import success_response, created_response
from app.api.common.exception_responses import standard_responses

router = APIRouter(prefix="/reminders", tags=["Reminders"])

@router.post(
    "/",
    response_model=APIResponse,
    summary="Create a new reminder",
    status_code=status.HTTP_201_CREATED,
    responses={**standard_responses},
)
def create_reminder(
    reminder: ReminderCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    user_id = int(payload.get("sub"))
    new_reminder = reminder_service.create_reminder(db, reminder, user_id)
    reminder_data = ReminderResponse.model_validate(new_reminder)
    return created_response(reminder_data, "Reminder created successfully")

@router.get(
    "/",
    response_model=APIResponse,
    summary="Get all reminders for current user",
    responses={**standard_responses},
)
def get_all_reminders(
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    user_id = int(payload.get("sub"))
    reminders = reminder_service.get_all_reminders(db, user_id)
    reminder_data = [ReminderResponse.model_validate(r) for r in reminders]
    return success_response(reminder_data, "Reminders retrieved successfully")

@router.get(
    "/active",
    response_model=APIResponse,
    summary="Get currently active reminders to display",
    responses={**standard_responses},
)
def get_active_reminders(
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    user_id = int(payload.get("sub"))
    active_reminders = reminder_service.get_active_reminders(db, user_id)
    reminder_data = [ReminderResponse.model_validate(r) for r in active_reminders]
    return success_response(reminder_data, "Active reminders retrieved successfully")

@router.get(
    "/{reminder_id}",
    response_model=APIResponse,
    summary="Get a specific reminder by ID",
    responses={**standard_responses},
)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    user_id = int(payload.get("sub"))
    reminder = reminder_service.get_reminder_by_id(db, reminder_id, user_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder_data = ReminderResponse.model_validate(reminder)
    return success_response(reminder_data, "Reminder retrieved successfully")

@router.put(
    "/{reminder_id}",
    response_model=APIResponse,
    summary="Update a reminder",
    responses={**standard_responses},
)
def update_reminder(
    reminder_id: int,
    reminder_update: ReminderUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    user_id = int(payload.get("sub"))
    try:
        updated_reminder = reminder_service.update_reminder(db, reminder_id, user_id, reminder_update)
        reminder_data = ReminderResponse.model_validate(updated_reminder)
        return success_response(reminder_data, "Reminder updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete(
    "/{reminder_id}",
    response_model=APIResponse,
    summary="Delete a reminder",
    responses={**standard_responses},
)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    user_id = int(payload.get("sub"))
    try:
        deleted_reminder = reminder_service.delete_reminder(db, reminder_id, user_id)
        reminder_data = ReminderResponse.model_validate(deleted_reminder)
        return success_response(reminder_data, "Reminder deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch(
    "/{reminder_id}/toggle",
    response_model=APIResponse,
    summary="Toggle reminder active status",
    responses={**standard_responses},
)
def toggle_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(verify_jwt)
):
    user_id = int(payload.get("sub"))
    try:
        toggled_reminder = reminder_service.toggle_reminder(db, reminder_id, user_id)
        reminder_data = ReminderResponse.model_validate(toggled_reminder)
        status_text = "enabled" if toggled_reminder.is_active else "disabled"
        return success_response(reminder_data, f"Reminder {status_text} successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
