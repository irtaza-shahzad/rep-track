from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON, Index, Enum, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.core.database import Base


class StatsPeriod(enum.Enum):
    day = "day"
    week = "week"
    month = "month"


class UserStats(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    total_workouts = Column(Integer, nullable=False, default=0)
    total_sets = Column(Integer, nullable=False, default=0)
    total_reps = Column(Integer, nullable=False, default=0)
    total_volume = Column(Float, nullable=False, default=0.0)
    avg_workout_duration_min = Column(Float, nullable=False, default=0.0)

    best_one_rep_max_by_exercise = Column(JSON, nullable=False, default={})
    muscle_group_breakdown = Column(JSON, nullable=False, default={})  # e.g., {"Chest": 145, "Back": 168, ...}

    last_updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="user_stats", passive_deletes=True)


class UserStatsTimeseries(Base):
    __tablename__ = "user_stats_timeseries"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    period = Column(Enum(StatsPeriod), nullable=False)
    period_start = Column(Date, nullable=False)

    workouts_completed = Column(Integer, nullable=False, default=0)
    sets_logged = Column(Integer, nullable=False, default=0)
    reps_logged = Column(Integer, nullable=False, default=0)
    volume = Column(Float, nullable=False, default=0.0)
    avg_duration_min = Column(Float, nullable=False, default=0.0)
    muscle_group_breakdown = Column(JSON, nullable=False, default={})  # e.g., {"Chest": 12, "Back": 15, ...}
    best_one_rep_max_by_exercise = Column(JSON, nullable=True)  # Best PRs achieved during this period

    __table_args__ = (
        Index("ux_user_period_start", "user_id", "period", "period_start", unique=True),
        Index("ix_timeseries_user_period_start", "user_id", "period", "period_start"),
    )


class WorkoutStatsEvent(Base):
    __tablename__ = "workout_stats_event"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    processed = Column(Integer, nullable=False, default=0)  # 0 = false, 1 = true
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ux_event_user_session", "user_id", "workout_session_id", unique=True),
    )
