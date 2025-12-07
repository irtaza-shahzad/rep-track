"""add streaks table

Revision ID: d1e2f3g4h5i6
Revises: c0a1_stats_tables
Create Date: 2025-12-03 01:03:47

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3g4h5i6'
down_revision: Union[str, None] = 'e82a34bc1dd0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create streaks table
    op.create_table(
        'streaks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_trained_date', sa.Date(), nullable=True),
        sa.Column('target_days_per_week', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('workouts_this_week', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('week_start_date', sa.Date(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_streaks_id'), 'streaks', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_streaks_id'), table_name='streaks')
    op.drop_table('streaks')
