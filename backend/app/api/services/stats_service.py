from datetime import datetime, date, timedelta, timezone
from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.workout_session_model import WorkoutSession
from app.models.workout_exercise_model import WorkoutExercise
from app.models.workout_set_model import WorkoutSet
from app.models.user_stats_model import UserStats, UserStatsTimeseries, WorkoutStatsEvent, StatsPeriod
from app.models.exercise_model import Exercise


# Compound movement categories
COMPOUND_MOVEMENTS = {
    "Bench Press": ["bench"],  # Matches any bench variation
    "Squat": ["squat"],  # Matches any squat variation
    "Deadlift": ["deadlift"],  # Matches any deadlift variation
    "Overhead Press": ["overhead", "shoulder press", "military press"],  # Matches overhead/shoulder press variations
    "Pull-ups": ["pull-up", "pull up", "pullup", "chin-up", "chin up", "chinup"],
}


def _get_compound_category(exercise_name: str) -> str:
    """Map an exercise name to its compound movement category."""
    exercise_lower = exercise_name.lower()
    for category, keywords in COMPOUND_MOVEMENTS.items():
        if any(keyword in exercise_lower for keyword in keywords):
            return category
    return exercise_name  # Return original name if not a compound movement


def _period_start_for_day(dt: datetime) -> date:
    return dt.date()


def _period_start_for_week(dt: datetime) -> date:
    # ISO week start (Monday)
    return (dt - timedelta(days=dt.weekday())).date()


def _period_start_for_month(dt: datetime) -> date:
    return date(dt.year, dt.month, 1)


def _compute_muscle_group_breakdown(db: Session, session: WorkoutSession) -> Dict[str, int]:
    """
    Compute muscle group breakdown for a workout session.
    Returns a dict like {"Chest": 12, "Back": 15, "Legs": 8, ...}
    """
    from app.models.exercise_model import Exercise
    
    muscle_group_sets = {}
    
    for workout_ex in session.workout_exercises:
        # Count completed, non-warmup sets for this exercise
        completed_sets = sum(
            1 for s in workout_ex.workout_sets 
            if s.completed and not (getattr(s, "is_warmup", False))
        )
        
        if completed_sets == 0:
            continue
        
        # Look up the exercise in the database to get its muscle group
        # First try to find user's custom exercise, then fall back to global
        exercise = db.query(Exercise).filter(
            Exercise.name == workout_ex.exercise_name,
            ((Exercise.user_id == session.user_id) | (Exercise.user_id == None))
        ).first()
        
        if exercise and exercise.muscle_group:
            # Get the muscle group value (handle enum)
            muscle_group = exercise.muscle_group.value if hasattr(exercise.muscle_group, 'value') else str(exercise.muscle_group)
            muscle_group_sets[muscle_group] = muscle_group_sets.get(muscle_group, 0) + completed_sets
        else:
            # Exercise not found in library - categorize as "Other"
            muscle_group_sets["Other"] = muscle_group_sets.get("Other", 0) + completed_sets
    
    return muscle_group_sets


def _compute_session_metrics(session: WorkoutSession) -> Dict[str, float]:
    # Only completed, non-warmup sets
    sets = [
        s for ex in session.workout_exercises for s in ex.workout_sets
        if s.completed and not (getattr(s, "is_warmup", False))
    ]

    total_sets = len(sets)
    total_reps = 0
    total_volume = 0.0
    for s in sets:
        try:
            reps = int(s.reps) if s.reps else 0
            weight = float(s.weight) if s.weight else 0.0
        except Exception:
            reps, weight = 0, 0.0
        total_reps += reps
        total_volume += reps * weight

    duration_min = (session.elapsed_seconds or 0) / 60.0

    return {
        "total_sets": total_sets,
        "total_reps": total_reps,
        "total_volume": total_volume,
        "duration_min": duration_min,
    }


def _update_best_prs(db: Session, stats: UserStats, session: WorkoutSession) -> Dict[str, float]:
    """Update best PRs grouped by compound movement categories.
    Returns a dict of PRs achieved in this session.
    """
    prs = dict(stats.best_one_rep_max_by_exercise or {})
    session_prs = {}  # Track PRs achieved in this session
    
    for ex in session.workout_exercises:
        # Map exercise name to compound category
        category = _get_compound_category(ex.exercise_name)
        
        # Get the current best for this category
        current_best = prs.get(category, 0.0)
        
        # Find the best 1RM estimate for this exercise in this session
        # For 1 rep: it IS the 1RM
        # For 2-10 reps: Use Epley formula: 1RM = w * (1 + reps/30)
        # For 10+ reps: Less accurate but still use Epley
        session_best = 0.0
        for s in ex.workout_sets:
            if not s.completed or s.is_warmup:
                continue
            try:
                reps = int(s.reps) if s.reps else 0
                weight = float(s.weight) if s.weight else 0.0
            except Exception:
                reps, weight = 0, 0.0
            
            # Sanity check: filter out unrealistic weights (likely data errors)
            # Max reasonable single-lift weight: 3000 lbs (allows for powerlifters using kg units)
            # World record deadlift is ~1100 lbs, so 3000 lbs (1360 kg) gives reasonable headroom
            if reps <= 0 or weight <= 0 or weight > 3000:
                continue
            
            # Calculate 1RM estimate
            if reps == 1:
                # For a single rep, the weight IS the 1RM
                est_1rm = weight
            else:
                # Use Epley formula for multiple reps: 1RM = w * (1 + reps/30)
                est_1rm = weight * (1 + reps / 30.0)
                
            if est_1rm > session_best:
                session_best = est_1rm
        
        # Track the best 1RM for this category in this session
        if session_best > 0:
            session_prs[category] = max(session_prs.get(category, 0.0), session_best)
            
        # Only update all-time best if this session's best is better
        if session_best > current_best:
            prs[category] = session_best
    
    stats.best_one_rep_max_by_exercise = prs
    return session_prs


def process_event(db: Session, event_id: int) -> None:
    event = db.query(WorkoutStatsEvent).filter(WorkoutStatsEvent.id == event_id).first()
    if not event or event.processed:
        return

    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == event.workout_session_id,
        WorkoutSession.user_id == event.user_id,
        WorkoutSession.is_completed == True
    ).options().first()
    if not session:
        # Either not completed or not found for user
        return

    # Ensure UserStats exists
    stats = db.query(UserStats).filter(UserStats.user_id == event.user_id).first()
    if not stats:
        stats = UserStats(user_id=event.user_id)
        db.add(stats)
        db.flush()

    metrics = _compute_session_metrics(session)

    # Update aggregates
    stats.total_workouts = (stats.total_workouts or 0) + 1
    stats.total_sets = (stats.total_sets or 0) + int(metrics["total_sets"]) 
    stats.total_reps = (stats.total_reps or 0) + int(metrics["total_reps"]) 
    stats.total_volume = float(stats.total_volume or 0.0) + float(metrics["total_volume"]) 

    # Update avg duration (incremental average)
    prev_count = max((stats.total_workouts - 1), 0)
    if prev_count == 0:
        stats.avg_workout_duration_min = float(metrics["duration_min"]) 
    else:
        stats.avg_workout_duration_min = (
            (stats.avg_workout_duration_min * prev_count) + float(metrics["duration_min"]) 
        ) / (prev_count + 1)

    session_prs = _update_best_prs(db, stats, session)
    
    # Update muscle group breakdown
    session_muscle_groups = _compute_muscle_group_breakdown(db, session)
    current_breakdown = dict(stats.muscle_group_breakdown or {})
    for muscle_group, sets_count in session_muscle_groups.items():
        current_breakdown[muscle_group] = current_breakdown.get(muscle_group, 0) + sets_count
    stats.muscle_group_breakdown = current_breakdown
    
    stats.last_updated_at = datetime.now(timezone.utc)

    # Update timeseries for day/week/month
    completed_dt = datetime.fromtimestamp((session.end_time or session.start_time) / 1000.0)
    def upsert_ts(period: StatsPeriod, start: date):
        row = db.query(UserStatsTimeseries).filter(
            UserStatsTimeseries.user_id == event.user_id,
            UserStatsTimeseries.period == period,
            UserStatsTimeseries.period_start == start
        ).first()
        if not row:
            row = UserStatsTimeseries(
                user_id=event.user_id,
                period=period,
                period_start=start
            )
            db.add(row)
            db.flush()
        row.workouts_completed = (row.workouts_completed or 0) + 1
        row.sets_logged = (row.sets_logged or 0) + int(metrics["total_sets"]) 
        row.reps_logged = (row.reps_logged or 0) + int(metrics["total_reps"]) 
        row.volume = float(row.volume or 0.0) + float(metrics["total_volume"]) 
        # Avg duration (incremental per bucket)
        # For simplicity, average of sessions in bucket
        count = row.workouts_completed
        if count == 1:
            row.avg_duration_min = float(metrics["duration_min"]) 
        else:
            row.avg_duration_min = (
                ((row.avg_duration_min or 0.0) * (count - 1)) + float(metrics["duration_min"]) 
            ) / count
        
        # Update muscle group breakdown for this period
        current_period_breakdown = dict(row.muscle_group_breakdown or {})
        for muscle_group, sets_count in session_muscle_groups.items():
            current_period_breakdown[muscle_group] = current_period_breakdown.get(muscle_group, 0) + sets_count
        row.muscle_group_breakdown = current_period_breakdown
        
        # Update best PRs for this period - track the best achieved SO FAR (cumulative)
        # This creates the step-wise progression: flat until new PR, then jump up
        current_period_prs = dict(row.best_one_rep_max_by_exercise or {})
        for category, pr_value in session_prs.items():
            # Only update if this is a new best for this period
            if pr_value > current_period_prs.get(category, 0.0):
                current_period_prs[category] = pr_value
        row.best_one_rep_max_by_exercise = current_period_prs

    # Compute muscle group breakdown for this session
    session_muscle_groups = _compute_muscle_group_breakdown(db, session)
    
    upsert_ts(StatsPeriod.day, _period_start_for_day(completed_dt))
    upsert_ts(StatsPeriod.week, _period_start_for_week(completed_dt))
    upsert_ts(StatsPeriod.month, _period_start_for_month(completed_dt))

    # Mark processed
    event.processed = 1
    event.processed_at = datetime.now(timezone.utc)
    db.commit()


def create_event_for_session(db: Session, user_id: int, workout_session_id: int) -> int:
    # Idempotent via unique index
    existing = db.query(WorkoutStatsEvent).filter(
        WorkoutStatsEvent.user_id == user_id,
        WorkoutStatsEvent.workout_session_id == workout_session_id
    ).first()
    if existing:
        return existing.id
    event = WorkoutStatsEvent(user_id=user_id, workout_session_id=workout_session_id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event.id


def recompute_user(db: Session, user_id: int) -> UserStats:
    # Clear aggregates and timeseries
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not stats:
        stats = UserStats(user_id=user_id)
        db.add(stats)
        db.flush()
    stats.total_workouts = 0
    stats.total_sets = 0
    stats.total_reps = 0
    stats.total_volume = 0.0
    stats.avg_workout_duration_min = 0.0
    stats.best_one_rep_max_by_exercise = {}
    stats.muscle_group_breakdown = {}

    db.query(UserStatsTimeseries).filter(UserStatsTimeseries.user_id == user_id).delete()
    db.commit()

    # Reprocess all completed sessions
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.is_completed == True
    ).options().all()

    for session in sessions:
        metrics = _compute_session_metrics(session)
        stats.total_workouts += 1
        stats.total_sets += int(metrics["total_sets"]) 
        stats.total_reps += int(metrics["total_reps"]) 
        stats.total_volume += float(metrics["total_volume"]) 
        # avg duration incremental
        count = stats.total_workouts
        if count == 1:
            stats.avg_workout_duration_min = float(metrics["duration_min"]) 
        else:
            stats.avg_workout_duration_min = (
                ((stats.avg_workout_duration_min or 0.0) * (count - 1)) + float(metrics["duration_min"]) 
            ) / count

        session_prs = _update_best_prs(db, stats, session)
        
        # Update muscle group breakdown
        session_muscle_groups = _compute_muscle_group_breakdown(db, session)
        current_breakdown = dict(stats.muscle_group_breakdown or {})
        for muscle_group, sets_count in session_muscle_groups.items():
            current_breakdown[muscle_group] = current_breakdown.get(muscle_group, 0) + sets_count
        stats.muscle_group_breakdown = current_breakdown

        completed_dt = datetime.fromtimestamp((session.end_time or session.start_time) / 1000.0)
        # timeseries buckets
        for period, start in [
            (StatsPeriod.day, _period_start_for_day(completed_dt)),
            (StatsPeriod.week, _period_start_for_week(completed_dt)),
            (StatsPeriod.month, _period_start_for_month(completed_dt)),
        ]:
            row = db.query(UserStatsTimeseries).filter(
                UserStatsTimeseries.user_id == user_id,
                UserStatsTimeseries.period == period,
                UserStatsTimeseries.period_start == start
            ).first()
            if not row:
                row = UserStatsTimeseries(user_id=user_id, period=period, period_start=start)
                db.add(row)
                db.flush()
            row.workouts_completed = (row.workouts_completed or 0) + 1
            row.sets_logged = (row.sets_logged or 0) + int(metrics["total_sets"]) 
            row.reps_logged = (row.reps_logged or 0) + int(metrics["total_reps"]) 
            row.volume = float(row.volume or 0.0) + float(metrics["total_volume"]) 
            count = row.workouts_completed
            if count == 1:
                row.avg_duration_min = float(metrics["duration_min"]) 
            else:
                row.avg_duration_min = (
                    ((row.avg_duration_min or 0.0) * (count - 1)) + float(metrics["duration_min"]) 
                ) / count
            
            # Update muscle group breakdown for this period
            current_period_breakdown = dict(row.muscle_group_breakdown or {})
            for muscle_group, sets_count in session_muscle_groups.items():
                current_period_breakdown[muscle_group] = current_period_breakdown.get(muscle_group, 0) + sets_count
            row.muscle_group_breakdown = current_period_breakdown
            
            # Update best PRs for this period - track the best achieved SO FAR (cumulative)
            # This creates the step-wise progression: flat until new PR, then jump up
            current_period_prs = dict(row.best_one_rep_max_by_exercise or {})
            for category, pr_value in session_prs.items():
                # Only update if this is a new best for this period
                if pr_value > current_period_prs.get(category, 0.0):
                    current_period_prs[category] = pr_value
            row.best_one_rep_max_by_exercise = current_period_prs

    stats.last_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(stats)
    return stats
