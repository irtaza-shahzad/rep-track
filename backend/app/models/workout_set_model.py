# app/models/workout_set_model.py
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, BigInteger, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class WorkoutSet(Base):
    """
    Represents a single set within an exercise during a workout.
    Tracks reps, weight, completion status, and optional metadata like RPE.
    """
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_exercise_id = Column(Integer, ForeignKey("workout_exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Position/order within the exercise (0, 1, 2, ...)
    position = Column(Integer, nullable=False, default=0)
    
    # Set data - using strings for flexibility
    # Can store: "10", "8-10", "AMRAP", etc.
    reps = Column(String(50), nullable=True)  # Allow null for incomplete sets
    weight = Column(String(50), nullable=True)  # Allow null for bodyweight or incomplete
    
    # Completion tracking
    completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(BigInteger, nullable=True)  # Epoch milliseconds
    
    # Optional metadata
    rpe = Column(Integer, nullable=True)  # Rate of Perceived Exertion (1-10)
    
    # Set type flags
    is_warmup = Column(Boolean, default=False, nullable=False)
    is_dropset = Column(Boolean, default=False, nullable=False)
    is_failure = Column(Boolean, default=False, nullable=False)

    # Relationships
    workout_exercise = relationship("WorkoutExercise", back_populates="workout_sets")

    def __repr__(self):
        return f"<WorkoutSet id={self.id} exercise={self.workout_exercise_id} reps={self.reps} weight={self.weight}>"
