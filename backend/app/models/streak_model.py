from sqlalchemy import Column, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Streak(Base):
    __tablename__ = "streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_trained_date = Column(Date, nullable=True)

    target_days_per_week = Column(Integer, nullable=False, default=3)
    workouts_this_week = Column(Integer, default=0)
    week_start_date = Column(Date, nullable=True)

    user = relationship("User", back_populates="streak")
