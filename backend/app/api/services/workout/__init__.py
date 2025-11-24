# app/api/services/workout/__init__.py
"""
Workout service module - modularized following SDA best practices.

This package follows the Single Responsibility Principle (SRP) by separating
concerns into focused service modules:

- session_service: Workout session lifecycle management
- exercise_service: Exercise operations within sessions
- set_service: Set operations and validation
- analytics_service: Analytics calculations and metrics

Benefits of this structure:
1. Better testability - each module can be tested independently
2. Easier maintenance - changes are isolated to specific modules
3. Follows SOLID principles - each class/module has one reason to change
4. Scalability - easy to add new analytics or features
5. Code reusability - modules can be composed as needed
"""

# Re-export commonly used functions for backwards compatibility
from app.api.services.workout.session_service import (
    start_workout_session,
    get_active_workout,
    get_workout_session_by_id,
    get_all_workout_sessions,
    update_workout_session,
    finish_workout_session,
    cancel_workout_session,
    delete_workout_session,
)

from app.api.services.workout.exercise_service import (
    add_exercise_to_session,
    update_workout_exercise,
    remove_exercise_from_session,
    reorder_exercises,
)

from app.api.services.workout.set_service import (
    add_set_to_exercise,
    update_set,
    delete_set,
)

from app.api.services.workout.analytics_service import (
    calculate_workout_analytics,
    calculate_exercise_volume,
    get_max_weight_for_exercise,
)

__all__ = [
    # Session operations
    'start_workout_session',
    'get_active_workout',
    'get_workout_session_by_id',
    'get_all_workout_sessions',
    'update_workout_session',
    'finish_workout_session',
    'cancel_workout_session',
    'delete_workout_session',
    
    # Exercise operations
    'add_exercise_to_session',
    'update_workout_exercise',
    'remove_exercise_from_session',
    'reorder_exercises',
    
    # Set operations
    'add_set_to_exercise',
    'update_set',
    'delete_set',
    
    # Analytics
    'calculate_workout_analytics',
    'calculate_exercise_volume',
    'get_max_weight_for_exercise',
]
