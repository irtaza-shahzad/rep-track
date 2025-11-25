# app/models/workout_exercise_model.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class WorkoutExercise(Base):
    """
    Represents an exercise within a workout session.
    Can be added from a template or added manually during the workout.
    """
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)
    
    position = Column(Integer, nullable=False, default=0)  # Order within the workout
    notes = Column(Text, nullable=True)

    # Relationships
    workout_session = relationship("WorkoutSession", back_populates="workout_exercises")
    exercise = relationship("Exercise", backref="workout_exercises")
    workout_sets = relationship(
        "WorkoutSet",
        back_populates="workout_exercise",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="WorkoutSet.set_number"
    )

    def __repr__(self):
        return f"<WorkoutExercise id={self.id} workout_session_id={self.workout_session_id} exercise_id={self.exercise_id}>"
