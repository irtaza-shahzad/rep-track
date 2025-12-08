from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime
from datetime import datetime, timezone
from app.core.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    exercises = relationship("Exercise", back_populates="user")

    templates = relationship("WorkoutTemplate", back_populates="owner", cascade="all, delete-orphan")
    
    workout_sessions = relationship("WorkoutSession", back_populates="user", cascade="all, delete-orphan")
    
    user_stats = relationship("UserStats", back_populates="user", cascade="all, delete-orphan", uselist=False)
    
    streak = relationship("Streak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")