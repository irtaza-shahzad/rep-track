from datetime import datetime, time, date, timedelta
from sqlalchemy.orm import Session
from app.models.reminder_model import Reminder, ReminderType
from app.models.streak_model import Streak
from app.api.schemas.reminder_schema import ReminderCreate, ReminderUpdate

def create_reminder(db: Session, reminder: ReminderCreate, user_id: int) -> Reminder:
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
    return db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    ).first()

def get_all_reminders(db: Session, user_id: int):
    return db.query(Reminder).filter(Reminder.user_id == user_id).all()

def update_reminder(db: Session, reminder_id: int, user_id: int, reminder_update: ReminderUpdate):
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
    reminder = get_reminder_by_id(db, reminder_id, user_id)
    if not reminder:
        raise ValueError("Reminder not found")
    
    db.delete(reminder)
    db.commit()
    return reminder

def toggle_reminder(db: Session, reminder_id: int, user_id: int):
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
    - Scheduled reminders matching current time and day
    - Smart reminders based on streak/workout status
    """
    now = datetime.now()
    current_time = now.time()
    current_day = now.weekday()  # 0=Monday, 6=Sunday
    # Convert to our format where 0=Sunday
    current_day_formatted = (current_day + 1) % 7
    
    active_reminders = []
    
    # Get all active reminders for user
    reminders = db.query(Reminder).filter(
        Reminder.user_id == user_id,
        Reminder.is_active == True
    ).all()
    
    for reminder in reminders:
        should_show = False
        
        if reminder.reminder_type == ReminderType.SCHEDULED:
            # Check if scheduled time matches (within 1 hour window)
            if reminder.scheduled_time and reminder.days_of_week:
                if current_day_formatted in reminder.days_of_week:
                    # Parse time string "HH:MM" and check if current time is within 1 hour after scheduled time
                    try:
                        hour, minute = map(int, reminder.scheduled_time.split(':'))
                        scheduled_datetime = datetime.combine(date.today(), time(hour, minute))
                        time_diff = (now - scheduled_datetime).total_seconds() / 60  # minutes
                        if 0 <= time_diff <= 60:  # Within 1 hour after scheduled time
                            should_show = True
                    except:
                        pass  # Invalid time format, skip
        
        elif reminder.reminder_type == ReminderType.DAILY_GOAL:
            # Show if user hasn't logged workout today and it's after 6 PM
            if current_time.hour >= 18:
                streak = db.query(Streak).filter(Streak.user_id == user_id).first()
                if streak and streak.last_trained_date != date.today():
                    should_show = True
        
        elif reminder.reminder_type == ReminderType.WEEKLY_TARGET:
            # Show if user is behind on weekly target (after Wednesday)
            if current_day >= 2:  # Wednesday or later
                streak = db.query(Streak).filter(Streak.user_id == user_id).first()
                if streak and streak.workouts_this_week < streak.target_days_per_week:
                    # Calculate remaining days in week
                    days_left = 7 - current_day
                    workouts_needed = streak.target_days_per_week - streak.workouts_this_week
                    if workouts_needed > days_left:
                        should_show = True
        
        elif reminder.reminder_type == ReminderType.STREAK_RISK:
            # Show if it's Sunday and user hasn't met weekly target
            if current_day == 6:  # Sunday
                streak = db.query(Streak).filter(Streak.user_id == user_id).first()
                if streak and streak.workouts_this_week < streak.target_days_per_week:
                    should_show = True
        
        elif reminder.reminder_type == ReminderType.MILESTONE:
            # Show milestone reminders (these would be created by system when milestones are reached)
            should_show = True
        
        if should_show:
            active_reminders.append(reminder)
    
    return active_reminders
