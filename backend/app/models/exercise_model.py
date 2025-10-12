from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
import enum

class MuscleGroup(enum.Enum):
    Chest = "Chest"
    Back = "Back"
    Shoulders = "Shoulders"
    Arms = "Arms"
    Legs = "Legs"
    Core = "Core"
    FullBody = "FullBody"
    Other = "Other"

class Category(enum.Enum):
    Strength = "Strength"
    Cardio = "Cardio"
    Flexibility = "Flexibility"
    Mobility = "Mobility"
    Other = "Other"

class Difficulty(enum.Enum):
    Beginner = "Beginner"
    Intermediate = "Intermediate"
    Advanced = "Advanced"

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True) 
    category = Column(Enum(Category), nullable=False)  
    difficulty = Column(Enum(Difficulty), nullable=False)  
    muscle_group = Column(Enum(MuscleGroup), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    user = relationship("User", back_populates="exercises")

    __table_args__ = (
        UniqueConstraint("name", "user_id", name="uq_exercise_name_user"),
    )