# app/models/template_exercise_model.py
from sqlalchemy import Column, Integer, ForeignKey, String, Float
from sqlalchemy.orm import relationship

from app.core.database import Base


class TemplateExercise(Base):
    __tablename__ = "template_exercises"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("workout_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False, index=True)

    # optional fields for per-template exercise customization
    position = Column(Integer, nullable=False, default=0, doc="Order of exercise inside template")
    sets = Column(Integer, nullable=True)
    reps = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True, doc="If exercise is time-based")
    rest_seconds = Column(Integer, nullable=True)
    notes = Column(String(500), nullable=True)

    # relationships
    template = relationship("WorkoutTemplate", back_populates="template_exercises")
    exercise = relationship("Exercise", back_populates="template_exercises")

    def __repr__(self):
        return f"<TemplateExercise id={self.id} template_id={self.template_id} exercise_id={self.exercise_id}>"
