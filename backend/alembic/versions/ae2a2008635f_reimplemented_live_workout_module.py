"""reimplemented_live_workout_module

Revision ID: ae2a2008635f
Revises: ac33c209733e
Create Date: 2025-11-26 11:54:08.387245

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'ae2a2008635f'
down_revision: Union[str, Sequence[str], None] = 'ac33c209733e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to new live workout structure."""
    
    # === workout_sessions table changes ===
    
    # Drop old columns
    op.drop_column('workout_sessions', 'status')
    op.drop_column('workout_sessions', 'end_time')
    op.drop_column('workout_sessions', 'duration_seconds')
    op.drop_column('workout_sessions', 'notes')
    op.drop_column('workout_sessions', 'total_volume')
    op.drop_column('workout_sessions', 'total_sets')
    op.drop_column('workout_sessions', 'total_reps')
    
    # Rename 'name' to 'workout_name'
    op.alter_column('workout_sessions', 'name', new_column_name='workout_name')
    
    # Add new columns
    op.add_column('workout_sessions', sa.Column('workout_number', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('workout_sessions', sa.Column('is_paused', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('workout_sessions', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
    
    # Change start_time from DateTime to BigInteger (epoch ms)
    # First add new column
    op.add_column('workout_sessions', sa.Column('start_time_new', sa.BigInteger(), nullable=True))
    
    # Copy data converting to milliseconds
    op.execute("""
        UPDATE workout_sessions 
        SET start_time_new = CAST(EXTRACT(EPOCH FROM start_time) * 1000 AS BIGINT)
    """)
    
    # Drop old column and rename new one
    op.drop_column('workout_sessions', 'start_time')
    op.alter_column('workout_sessions', 'start_time_new', new_column_name='start_time')
    op.alter_column('workout_sessions', 'start_time', nullable=False)
    
    # Change timestamps to BigInteger
    op.add_column('workout_sessions', sa.Column('created_at_new', sa.BigInteger(), nullable=True))
    op.add_column('workout_sessions', sa.Column('updated_at_new', sa.BigInteger(), nullable=True))
    
    op.execute("""
        UPDATE workout_sessions 
        SET created_at_new = CAST(EXTRACT(EPOCH FROM created_at) * 1000 AS BIGINT),
            updated_at_new = CAST(EXTRACT(EPOCH FROM updated_at) * 1000 AS BIGINT)
    """)
    
    op.drop_column('workout_sessions', 'created_at')
    op.drop_column('workout_sessions', 'updated_at')
    op.alter_column('workout_sessions', 'created_at_new', new_column_name='created_at')
    op.alter_column('workout_sessions', 'updated_at_new', new_column_name='updated_at')
    
    # === workout_exercises table changes ===
    
    # Drop notes column
    op.drop_column('workout_exercises', 'notes')
    
    # === workout_sets table changes ===
    
    # Drop old columns
    op.drop_column('workout_sets', 'duration_seconds')
    op.drop_column('workout_sets', 'distance')
    op.drop_column('workout_sets', 'notes')
    op.drop_column('workout_sets', 'is_completed')
    op.drop_column('workout_sets', 'completed_at')
    
    # Rename set_number to position
    op.alter_column('workout_sets', 'set_number', new_column_name='position')
    
    # Change weight and reps to String
    # Add new columns
    op.add_column('workout_sets', sa.Column('reps_new', sa.String(50), nullable=True))
    op.add_column('workout_sets', sa.Column('weight_new', sa.String(50), nullable=True))
    
    # Copy data converting to strings
    op.execute("""
        UPDATE workout_sets 
        SET reps_new = CAST(reps AS VARCHAR),
            weight_new = CAST(weight AS VARCHAR)
        WHERE reps IS NOT NULL OR weight IS NOT NULL
    """)
    
    # Default empty strings
    op.execute("""
        UPDATE workout_sets 
        SET reps_new = '' WHERE reps_new IS NULL
    """)
    op.execute("""
        UPDATE workout_sets 
        SET weight_new = '' WHERE weight_new IS NULL
    """)
    
    # Drop old columns and rename
    op.drop_column('workout_sets', 'reps')
    op.drop_column('workout_sets', 'weight')
    op.alter_column('workout_sets', 'reps_new', new_column_name='reps')
    op.alter_column('workout_sets', 'weight_new', new_column_name='weight')
    op.alter_column('workout_sets', 'reps', nullable=False)
    op.alter_column('workout_sets', 'weight', nullable=False)
    
    # Add new 'completed' column
    op.add_column('workout_sets', sa.Column('completed', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema back to old structure."""
    
    # === workout_sets table changes ===
    op.drop_column('workout_sets', 'completed')
    
    # Change reps and weight back to numeric types
    op.add_column('workout_sets', sa.Column('reps_old', sa.Integer(), nullable=True))
    op.add_column('workout_sets', sa.Column('weight_old', sa.Float(), nullable=True))
    
    op.execute("""
        UPDATE workout_sets 
        SET reps_old = CAST(NULLIF(reps, '') AS INTEGER),
            weight_old = CAST(NULLIF(weight, '') AS FLOAT)
    """)
    
    op.drop_column('workout_sets', 'reps')
    op.drop_column('workout_sets', 'weight')
    op.alter_column('workout_sets', 'reps_old', new_column_name='reps')
    op.alter_column('workout_sets', 'weight_old', new_column_name='weight')
    
    op.alter_column('workout_sets', 'position', new_column_name='set_number')
    
    op.add_column('workout_sets', sa.Column('duration_seconds', sa.Integer(), nullable=True))
    op.add_column('workout_sets', sa.Column('distance', sa.Float(), nullable=True))
    op.add_column('workout_sets', sa.Column('notes', sa.String(500), nullable=True))
    op.add_column('workout_sets', sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('workout_sets', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    
    # === workout_exercises table changes ===
    op.add_column('workout_exercises', sa.Column('notes', sa.Text(), nullable=True))
    
    # === workout_sessions table changes ===
    
    # Change timestamps back
    op.add_column('workout_sessions', sa.Column('created_at_old', sa.DateTime(timezone=True), nullable=True))
    op.add_column('workout_sessions', sa.Column('updated_at_old', sa.DateTime(timezone=True), nullable=True))
    
    op.execute("""
        UPDATE workout_sessions 
        SET created_at_old = to_timestamp(created_at / 1000.0),
            updated_at_old = to_timestamp(updated_at / 1000.0)
    """)
    
    op.drop_column('workout_sessions', 'created_at')
    op.drop_column('workout_sessions', 'updated_at')
    op.alter_column('workout_sessions', 'created_at_old', new_column_name='created_at')
    op.alter_column('workout_sessions', 'updated_at_old', new_column_name='updated_at')
    
    # Change start_time back
    op.add_column('workout_sessions', sa.Column('start_time_old', sa.DateTime(timezone=True), nullable=True))
    
    op.execute("""
        UPDATE workout_sessions 
        SET start_time_old = to_timestamp(start_time / 1000.0)
    """)
    
    op.drop_column('workout_sessions', 'start_time')
    op.alter_column('workout_sessions', 'start_time_old', new_column_name='start_time')
    
    op.drop_column('workout_sessions', 'is_active')
    op.drop_column('workout_sessions', 'is_paused')
    op.drop_column('workout_sessions', 'workout_number')
    
    op.alter_column('workout_sessions', 'workout_name', new_column_name='name')
    
    op.add_column('workout_sessions', sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'CANCELLED', name='workoutstatus'), nullable=False, server_default='ACTIVE'))
    op.add_column('workout_sessions', sa.Column('end_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('workout_sessions', sa.Column('duration_seconds', sa.Integer(), nullable=True))
    op.add_column('workout_sessions', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('workout_sessions', sa.Column('total_volume', sa.Float(), nullable=True))
    op.add_column('workout_sessions', sa.Column('total_sets', sa.Integer(), nullable=True))
    op.add_column('workout_sessions', sa.Column('total_reps', sa.Integer(), nullable=True))

