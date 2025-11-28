# app/models/workout_exercise_model.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class WorkoutExercise(Base):
    """
    Represents an exercise within a workout session.
    Each exercise contains multiple sets and is ordered within the workout.
    """
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Exercise reference - store name directly for flexibility
    # (Frontend uses exercise names, not necessarily IDs from exercise library)
    exercise_name = Column(String(200), nullable=False)
    
    # Position/order within the workout (0, 1, 2, ...)
    position = Column(Integer, nullable=False, default=0)
    
    # Optional notes for this exercise in this workout
    notes = Column(Text, nullable=True)

    # Relationships
    workout_session = relationship("WorkoutSession", back_populates="workout_exercises")
    workout_sets = relationship(
        "WorkoutSet",
        back_populates="workout_exercise",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="WorkoutSet.position"
    )

    def __repr__(self):
        return f"<WorkoutExercise id={self.id} workout={self.workout_session_id} exercise='{self.exercise_name}'>"
