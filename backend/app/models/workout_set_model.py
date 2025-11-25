# app/models/workout_set_model.py
from sqlalchemy import Column, Integer, Float, ForeignKey, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class WorkoutSet(Base):
    """
    Represents a single set within a workout exercise.
    All fields (weight, reps, etc.) are optional to support flexible logging.
    A set must be marked as completed (is_completed=True) to count toward totals.
    Invalid/incomplete sets are discarded when finishing the workout.
    """
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_exercise_id = Column(Integer, ForeignKey("workout_exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    set_number = Column(Integer, nullable=False)  # Order within the exercise (1, 2, 3, ...)
    
    # Actual logged data - all optional
    weight = Column(Float, nullable=True)  # In kg or lbs
    reps = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # For time-based exercises
    distance = Column(Float, nullable=True)  # For cardio (km, miles, meters)
    rpe = Column(Integer, nullable=True)  # Rate of Perceived Exertion (1-10)
    notes = Column(String(500), nullable=True)
    
    # Completion tracking - CRITICAL for workout flow
    is_completed = Column(Boolean, default=False, nullable=False)  # Must be True to count
    completed_at = Column(DateTime(timezone=True), nullable=True)  # When set was marked complete
    
    # Set type indicators
    is_warmup = Column(Boolean, default=False)
    is_dropset = Column(Boolean, default=False)
    is_failure = Column(Boolean, default=False)

    # Relationships
    workout_exercise = relationship("WorkoutExercise", back_populates="workout_sets")

    def __repr__(self):
        return f"<WorkoutSet id={self.id} workout_exercise_id={self.workout_exercise_id} set={self.set_number}>"
