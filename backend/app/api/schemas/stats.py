from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date


class StatsSummary(BaseModel):
    totalWorkouts: int
    totalSets: int
    totalReps: int
    totalVolume: float
    avgWorkoutDurationMin: float
    bestOneRepMaxByExercise: Dict[str, float] = Field(default_factory=dict)
    muscleGroupBreakdown: Dict[str, int] = Field(default_factory=dict)
    lastUpdatedAt: datetime


class TimeseriesPoint(BaseModel):
    periodStart: date
    workoutsCompleted: int
    setsLogged: int
    repsLogged: int
    volume: float
    avgDurationMin: float
    muscleGroupBreakdown: Dict[str, int] = Field(default_factory=dict)
    bestOneRepMaxByExercise: Optional[Dict[str, float]] = Field(default=None)
