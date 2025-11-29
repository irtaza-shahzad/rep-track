"""add_pr_tracking_to_timeseries

Revision ID: e82a34bc1dd0
Revises: cb19626b1b6c
Create Date: 2025-11-29 18:58:30.144213

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e82a34bc1dd0'
down_revision: Union[str, Sequence[str], None] = 'cb19626b1b6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add best_one_rep_max_by_exercise JSON column to user_stats_timeseries
    # This will store the best PR achieved during each time period
    op.add_column(
        'user_stats_timeseries',
        sa.Column('best_one_rep_max_by_exercise', sa.JSON(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the best_one_rep_max_by_exercise column
    op.drop_column('user_stats_timeseries', 'best_one_rep_max_by_exercise')
