# app/models/template_model.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationship to owner (User)
    owner = relationship("User", back_populates="templates")

    # relationship to TemplateExercise entries
    template_exercises = relationship(
        "TemplateExercise",
        back_populates="template",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="TemplateExercise.position"
    )
    
    # relationship to WorkoutSession (sessions created from this template)
    workout_sessions = relationship(
        "WorkoutSession",
        back_populates="template"
    )

    def __repr__(self):
        return f"<WorkoutTemplate id={self.id} name={self.name!r} owner_id={self.owner_id}>"
