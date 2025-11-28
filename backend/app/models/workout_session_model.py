# app/models/workout_session_model.py
from sqlalchemy import Column, Integer, String, BigInteger, ForeignKey, Boolean, Float, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class WorkoutSession(Base):
    """
    Represents a workout session (active or completed).
    
    Key constraints:
    - Only one active workout per user at a time (enforced by unique partial index)
    - Uses epoch milliseconds for all timestamps
    - Tracks both in-progress state and completion analytics
    """
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="SET NULL"), nullable=True)
    
    # Workout identification
    workout_number = Column(Integer, nullable=False)  # Sequential number for user's workouts (1, 2, 3...)
    workout_name = Column(String(200), nullable=True)  # Optional user-provided name
    
    # State tracking
    is_active = Column(Boolean, nullable=False, default=True, index=True)  # True = in-progress, False = completed/cancelled
    is_paused = Column(Boolean, nullable=False, default=False)  # Whether timer is currently paused
    is_completed = Column(Boolean, nullable=False, default=False)  # True if finished normally, False if cancelled
    
    # Time tracking (all in epoch milliseconds)
    start_time = Column(BigInteger, nullable=False)  # When workout started
    elapsed_seconds = Column(Integer, nullable=False, default=0)  # Total elapsed time in seconds
    end_time = Column(BigInteger, nullable=True)  # When workout ended (null if still active)
    
    # Completion analytics (computed when workout finishes)
    total_volume = Column(Float, nullable=True)  # Sum of (weight * reps) for all completed sets
    total_sets = Column(Integer, nullable=True)  # Count of completed sets
    total_reps = Column(Integer, nullable=True)  # Sum of reps across completed sets
    exercises_count = Column(Integer, nullable=True)  # Number of distinct exercises
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(BigInteger, nullable=True)
    updated_at = Column(BigInteger, nullable=True)

    # Relationships
    user = relationship("User", back_populates="workout_sessions")
    template = relationship("WorkoutTemplate", back_populates="workout_sessions")
    workout_exercises = relationship(
        "WorkoutExercise",
        back_populates="workout_session",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="WorkoutExercise.position"
    )
    
    # Create unique partial index: only one active workout per user
    __table_args__ = (
        Index(
            'idx_one_active_workout_per_user',
            user_id,
            unique=True,
            postgresql_where=(is_active == True)
        ),
    )

    def __repr__(self):
        return f"<WorkoutSession id={self.id} user_id={self.user_id} active={self.is_active} number={self.workout_number}>"
