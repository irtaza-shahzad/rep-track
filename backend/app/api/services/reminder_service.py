from datetime import datetime, time, date, timedelta
from sqlalchemy.orm import Session
from app.models.reminder_model import Reminder, ReminderType
from app.models.streak_model import Streak
from app.api.schemas.reminder_schema import ReminderCreate, ReminderUpdate

def create_reminder(db: Session, reminder: ReminderCreate, user_id: int) -> Reminder:
    """Create a new reminder for the specified user."""
    new_reminder = Reminder(
        user_id=user_id,
        reminder_type=reminder.reminder_type,
        title=reminder.title,
        description=reminder.description,
        scheduled_time=reminder.scheduled_time,
        days_of_week=reminder.days_of_week,
        is_active=reminder.is_active
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return new_reminder

def get_reminder_by_id(db: Session, reminder_id: int, user_id: int):
    """Get a specific reminder by ID. SECURITY: Filters by user_id to prevent unauthorized access."""
    return db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id  # CRITICAL: User can only access their own reminders
    ).first()

def get_all_reminders(db: Session, user_id: int):
    """Get all reminders for a specific user. SECURITY: Filters by user_id."""
    return db.query(Reminder).filter(Reminder.user_id == user_id).all()

def update_reminder(db: Session, reminder_id: int, user_id: int, reminder_update: ReminderUpdate):
    """Update a reminder. SECURITY: Only allows updating user's own reminders."""
    reminder = get_reminder_by_id(db, reminder_id, user_id)
    if not reminder:
        raise ValueError("Reminder not found")
    
    update_data = reminder_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reminder, key, value)
    
    reminder.updated_at = datetime.now()
    db.commit()
    db.refresh(reminder)
    return reminder

def delete_reminder(db: Session, reminder_id: int, user_id: int):
    """Delete a reminder. SECURITY: Only allows deleting user's own reminders."""
    reminder = get_reminder_by_id(db, reminder_id, user_id)
    if not reminder:
        raise ValueError("Reminder not found")
    
    db.delete(reminder)
    db.commit()
    return reminder

def toggle_reminder(db: Session, reminder_id: int, user_id: int):
    """Toggle reminder active status. SECURITY: Only allows toggling user's own reminders."""
    reminder = get_reminder_by_id(db, reminder_id, user_id)
    if not reminder:
        raise ValueError("Reminder not found")
    
    reminder.is_active = not reminder.is_active
    reminder.updated_at = datetime.now()
    db.commit()
    db.refresh(reminder)
    return reminder

def get_active_reminders(db: Session, user_id: int):
    """
    Get all reminders that should be displayed now based on:
    - Scheduled reminders matching current time and day (IMPROVED: 15 min before, 30 min after)
    - Smart reminders based on streak/workout status
    
    SECURITY: Only returns reminders for the specified user_id.
    """
    now = datetime.now()
    current_time = now.time()
    current_day = now.weekday()  # 0=Monday, 6=Sunday
    # Convert to our format where 0=Sunday
    current_day_formatted = (current_day + 1) % 7
    
    active_reminders = []
    
    # SECURITY: Get all active reminders for THIS USER ONLY
    reminders = db.query(Reminder).filter(
        Reminder.user_id == user_id,  # CRITICAL: Only this user's reminders
        Reminder.is_active == True
    ).all()
    
    for reminder in reminders:
        should_show = False
        
        if reminder.reminder_type == ReminderType.SCHEDULED:
            # Show 15 minutes BEFORE and up to 30 minutes AFTER scheduled time
            if reminder.scheduled_time and reminder.days_of_week:
                if current_day_formatted in reminder.days_of_week:
                    try:
                        hour, minute = map(int, reminder.scheduled_time.split(':'))
                        scheduled_datetime = datetime.combine(date.today(), time(hour, minute))
                        
                        # Calculate time difference in minutes
                        time_diff = (now - scheduled_datetime).total_seconds() / 60
                        
                        # Show from 15 minutes BEFORE to 30 minutes AFTER
                        if -15 <= time_diff <= 30:
                            should_show = True
                    except:
                        pass  # Invalid time format, skip
        
        if should_show:
            active_reminders.append(reminder)
    
    return active_reminders
