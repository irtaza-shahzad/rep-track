# app/api/services/workout/analytics_service.py
"""
Service layer for workout analytics calculations.
Follows Single Responsibility Principle - handles only analytics computations.
Separated to support future analytics features (PRs, streaks, graphs).
"""
from typing import Dict
from app.models.workout_session_model import WorkoutSession


def calculate_workout_analytics(session: WorkoutSession) -> Dict[str, float]:
    """
    Calculate analytics for a completed workout session.
    Returns dictionary with total_volume, total_reps, total_sets.
    
    This function is designed to be extended for future analytics:
    - PR detection
    - Volume progression
    - Personal records tracking
    """
    total_volume = 0.0
    total_reps = 0
    total_sets = 0
    
    for workout_ex in session.workout_exercises:
        for workout_set in workout_ex.workout_sets:
            # Calculate volume (weight * reps)
            if workout_set.weight is not None and workout_set.reps is not None:
                total_volume += workout_set.weight * workout_set.reps
                total_reps += workout_set.reps
            
            total_sets += 1
    
    return {
        'total_volume': total_volume,
        'total_reps': total_reps,
        'total_sets': total_sets
    }


def calculate_exercise_volume(exercise_id: int, session: WorkoutSession) -> float:
    """
    Calculate total volume for a specific exercise in a workout.
    Future use: PR tracking, exercise-specific analytics.
    """
    volume = 0.0
    
    for workout_ex in session.workout_exercises:
        if workout_ex.exercise_id == exercise_id:
            for workout_set in workout_ex.workout_sets:
                if workout_set.weight is not None and workout_set.reps is not None:
                    volume += workout_set.weight * workout_set.reps
    
    return volume


def get_max_weight_for_exercise(exercise_id: int, session: WorkoutSession) -> float:
    """
    Get maximum weight lifted for an exercise in a workout.
    Future use: PR detection, 1RM calculations.
    """
    max_weight = 0.0
    
    for workout_ex in session.workout_exercises:
        if workout_ex.exercise_id == exercise_id:
            for workout_set in workout_ex.workout_sets:
                if workout_set.weight is not None and not workout_set.is_warmup:
                    max_weight = max(max_weight, workout_set.weight)
    
    return max_weight
