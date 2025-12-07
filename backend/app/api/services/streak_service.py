from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.streak_model import Streak

def get_streak_by_user_id(db: Session, user_id: int):
    return db.query(Streak).filter(Streak.user_id == user_id).first()


def start_streak(db: Session, user_id: int, target_days_per_week: int):
    streak = get_streak_by_user_id(db, user_id)
    if streak:
        raise ValueError("Streak already exists for this user. Use update endpoint to modify target days.")

    today = date.today()
    streak = Streak(
        user_id=user_id,
        target_days_per_week=target_days_per_week,
        current_streak=0,
        longest_streak=0,
        workouts_this_week=0,
        week_start_date=today - timedelta(days=today.weekday()),  # Monday as start of week
        last_trained_date=None
    )
    db.add(streak)
    db.commit()
    db.refresh(streak)
    return streak


def log_workout(db: Session, user_id: int):
    """
    Streak increments by 1 on EVERY workout (daily logic).
    Cap: Maximum workouts_this_week = target_days_per_week (no over-counting).
    Weekly reset: If user didn't meet target by Monday, streak resets to 0.
    Same-day protection: Only first workout of the day counts.
    """
    streak = get_streak_by_user_id(db, user_id)
    today = date.today()
    
    if not streak:
        # Silently skip if user hasn't started streak (don't raise error)
        return None

    # Determine start of current week (Monday)
    current_week_start = today - timedelta(days=today.weekday())

    # If week changed → check if user met last week's target
    if streak.week_start_date != current_week_start:
        if streak.workouts_this_week < streak.target_days_per_week:
            # User failed to meet target, reset streak to 0
            streak.current_streak = 0
        # If target was met, streak continues (no reset)
        
        # Reset for new week
        streak.workouts_this_week = 0
        streak.week_start_date = current_week_start

    # Only process if this is the FIRST workout today (same-day protection)
    if streak.last_trained_date != today:
        # Only increment workouts_this_week if under the weekly cap
        if streak.workouts_this_week < streak.target_days_per_week:
            streak.workouts_this_week += 1
            
            # Increment streak by 1 for this workout
            streak.current_streak += 1
            
            # Update longest streak if current streak exceeds it
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
        
        # Always update last_trained_date regardless of cap
        streak.last_trained_date = today

    db.commit()
    db.refresh(streak)
    return streak


def get_leaderboard(db: Session, limit: int = 10):
    return (
        db.query(Streak)
        .order_by(Streak.current_streak.desc())
        .limit(limit)
        .all()
    )


def reset_streak(db: Session, user_id: int):
    streak = get_streak_by_user_id(db, user_id)
    if not streak:
        raise ValueError("User has not started a streak yet")

    streak.current_streak = 0
    streak.workouts_this_week = 0
    streak.last_trained_date = None

    db.commit()
    db.refresh(streak)
    return streak


def update_target_days(db: Session, user_id: int, target_days_per_week: int):
    streak = get_streak_by_user_id(db, user_id)
    if not streak:
        raise ValueError("User has not started a streak yet")

    streak.target_days_per_week = target_days_per_week
    db.commit()
    db.refresh(streak)
    return streak
