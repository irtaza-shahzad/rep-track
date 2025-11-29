from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.services.auth_service import get_current_user
from app.models.user_model import User
from app.models.user_stats_model import UserStats, UserStatsTimeseries, StatsPeriod
from app.api.schemas.stats import StatsSummary, TimeseriesPoint
from app.api.services import stats_service

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("/summary", response_model=StatsSummary)
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if not stats:
        # Create empty stats for first-time users
        stats = UserStats(user_id=current_user.id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return StatsSummary(
        totalWorkouts=stats.total_workouts or 0,
        totalSets=stats.total_sets or 0,
        totalReps=stats.total_reps or 0,
        totalVolume=float(stats.total_volume or 0.0),
        avgWorkoutDurationMin=float(stats.avg_workout_duration_min or 0.0),
        bestOneRepMaxByExercise=stats.best_one_rep_max_by_exercise or {},
        muscleGroupBreakdown=stats.muscle_group_breakdown or {},
        lastUpdatedAt=stats.last_updated_at,
    )


@router.get("/timeseries", response_model=list[TimeseriesPoint])
def get_timeseries(
    period: StatsPeriod = Query(..., description="day|week|month"),
    from_: str = Query(..., alias="from"),
    to: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.fromisoformat(from_).date()
    end = datetime.fromisoformat(to).date()
    rows = db.query(UserStatsTimeseries).filter(
        UserStatsTimeseries.user_id == current_user.id,
        UserStatsTimeseries.period == period,
        UserStatsTimeseries.period_start >= start,
        UserStatsTimeseries.period_start <= end,
    ).order_by(UserStatsTimeseries.period_start.asc()).all()
    return [
        TimeseriesPoint(
            periodStart=r.period_start,
            workoutsCompleted=r.workouts_completed or 0,
            setsLogged=r.sets_logged or 0,
            repsLogged=r.reps_logged or 0,
            volume=float(r.volume or 0.0),
            avgDurationMin=float(r.avg_duration_min or 0.0),
            muscleGroupBreakdown=r.muscle_group_breakdown or {},
            bestOneRepMaxByExercise=r.best_one_rep_max_by_exercise,
        )
        for r in rows
    ]


@router.post("/recompute", response_model=StatsSummary)
def recompute(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stats = stats_service.recompute_user(db, current_user.id)
    return StatsSummary(
        totalWorkouts=stats.total_workouts or 0,
        totalSets=stats.total_sets or 0,
        totalReps=stats.total_reps or 0,
        totalVolume=float(stats.total_volume or 0.0),
        avgWorkoutDurationMin=float(stats.avg_workout_duration_min or 0.0),
        bestOneRepMaxByExercise=stats.best_one_rep_max_by_exercise or {},
        muscleGroupBreakdown=stats.muscle_group_breakdown or {},
        lastUpdatedAt=stats.last_updated_at,
    )
