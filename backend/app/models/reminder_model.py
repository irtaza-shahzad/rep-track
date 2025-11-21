from sqlalchemy import Column, Integer, String, Boolean, Time, JSON, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
import enum

class ReminderType(str, enum.Enum):
    SCHEDULED = "Scheduled"
    DAILY_GOAL = "DailyGoal"
    WEEKLY_TARGET = "WeeklyTarget"
    STREAK_RISK = "StreakRisk"
    MILESTONE = "Milestone"

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reminder_type = Column(SQLEnum(ReminderType), nullable=False, default=ReminderType.SCHEDULED)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    scheduled_time = Column(String(5), nullable=True)  # Store as "HH:MM" format
    days_of_week = Column(JSON, nullable=True)  
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reminders")
