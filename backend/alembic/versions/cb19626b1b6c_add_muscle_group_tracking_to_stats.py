"""add_muscle_group_tracking_to_stats

Revision ID: cb19626b1b6c
Revises: 280285abf99c
Create Date: 2025-11-29 17:36:39.179385

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cb19626b1b6c'
down_revision: Union[str, Sequence[str], None] = '280285abf99c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add muscle_group_breakdown JSON column to user_stats
    op.add_column('user_stats', sa.Column('muscle_group_breakdown', sa.JSON(), nullable=False, server_default='{}'))
    
    # Add muscle_group_breakdown JSON column to user_stats_timeseries
    op.add_column('user_stats_timeseries', sa.Column('muscle_group_breakdown', sa.JSON(), nullable=False, server_default='{}'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove muscle_group_breakdown columns
    op.drop_column('user_stats_timeseries', 'muscle_group_breakdown')
    op.drop_column('user_stats', 'muscle_group_breakdown')
