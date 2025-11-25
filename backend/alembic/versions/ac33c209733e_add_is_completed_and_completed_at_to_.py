"""add_is_completed_and_completed_at_to_workout_sets

Revision ID: ac33c209733e
Revises: d51ae7b061f3
Create Date: 2025-11-25 04:02:08.423447

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac33c209733e'
down_revision: Union[str, Sequence[str], None] = 'd51ae7b061f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_completed column (NOT NULL with default False)
    op.add_column('workout_sets', 
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.false())
    )
    
    # Add completed_at column (nullable timestamp with timezone)
    op.add_column('workout_sets', 
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the columns in reverse order
    op.drop_column('workout_sets', 'completed_at')
    op.drop_column('workout_sets', 'is_completed')
