"""add_performance_indexes

Revision ID: 8c99f4582773
Revises: b4c6bcfcd246
Create Date: 2025-11-27 22:24:47.963486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c99f4582773'
down_revision: Union[str, Sequence[str], None] = 'b4c6bcfcd246'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add indexes for frequently queried columns to improve performance."""
    # Exercises table - frequently filtered by category, muscle_group, difficulty
    op.create_index('idx_exercises_category', 'exercises', ['category'])
    op.create_index('idx_exercises_muscle_group', 'exercises', ['muscle_group'])
    op.create_index('idx_exercises_difficulty', 'exercises', ['difficulty'])
    op.create_index('idx_exercises_user_id', 'exercises', ['user_id'])
    
    # Workout templates - frequently queried by owner
    op.create_index('idx_workout_templates_owner_id', 'workout_templates', ['owner_id'])
    
    # Template exercises - frequently joined
    op.create_index('idx_template_exercises_template_id', 'template_exercises', ['template_id'])
    op.create_index('idx_template_exercises_exercise_id', 'template_exercises', ['exercise_id'])
    
    # Workout sessions - frequently queried by user and status
    op.create_index('idx_workout_sessions_user_id', 'workout_sessions', ['user_id'])
    op.create_index('idx_workout_sessions_is_active', 'workout_sessions', ['is_active'])
    op.create_index('idx_workout_sessions_is_completed', 'workout_sessions', ['is_completed'])
    
    # Workout exercises - frequently joined
    op.create_index('idx_workout_exercises_workout_session_id', 'workout_exercises', ['workout_session_id'])
    
    # Workout sets - frequently joined
    op.create_index('idx_workout_sets_workout_exercise_id', 'workout_sets', ['workout_exercise_id'])


def downgrade() -> None:
    """Remove performance indexes."""
    op.drop_index('idx_workout_sets_workout_exercise_id', 'workout_sets')
    op.drop_index('idx_workout_exercises_workout_session_id', 'workout_exercises')
    op.drop_index('idx_workout_sessions_is_completed', 'workout_sessions')
    op.drop_index('idx_workout_sessions_is_active', 'workout_sessions')
    op.drop_index('idx_workout_sessions_user_id', 'workout_sessions')
    op.drop_index('idx_template_exercises_exercise_id', 'template_exercises')
    op.drop_index('idx_template_exercises_template_id', 'template_exercises')
    op.drop_index('idx_workout_templates_owner_id', 'workout_templates')
    op.drop_index('idx_exercises_user_id', 'exercises')
    op.drop_index('idx_exercises_difficulty', 'exercises')
    op.drop_index('idx_exercises_muscle_group', 'exercises')
    op.drop_index('idx_exercises_category', 'exercises')
