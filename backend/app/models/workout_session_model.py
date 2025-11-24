# app/models/workout_session_model.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float, Text, func
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
import enum


class WorkoutStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WorkoutSession(Base):
    """
    Represents a live or completed workout session.
    Stores all data needed for analytics: volume, PRs, streaks, graphs, etc.
    """
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True, index=True)
    
    status = Column(Enum(WorkoutStatus), nullable=False, default=WorkoutStatus.ACTIVE)
    
    # Time tracking
    start_time = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # Computed when workout finishes
    
    # Metadata
    name = Column(String(200), nullable=True)  # Optional workout name
    notes = Column(Text, nullable=True)
    
    # Analytics fields (computed when workout finishes)
    total_volume = Column(Float, nullable=True)  # Sum of (weight * reps) across all sets
    total_sets = Column(Integer, nullable=True)
    total_reps = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="workout_sessions")
    template = relationship("WorkoutTemplate", backref="workout_sessions")
    workout_exercises = relationship(
        "WorkoutExercise",
        back_populates="workout_session",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="WorkoutExercise.position"
    )

    def __repr__(self):
        return f"<WorkoutSession id={self.id} user_id={self.user_id} status={self.status.value}>"
