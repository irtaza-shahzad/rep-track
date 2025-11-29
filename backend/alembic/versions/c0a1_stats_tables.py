"""create stats tables

Revision ID: c0a1_stats_tables
Revises: 8c99f4582773
Create Date: 2025-11-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c0a1_stats_tables'
down_revision = '8c99f4582773'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_stats',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('total_workouts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_sets', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_reps', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_volume', sa.Float(), nullable=False, server_default='0'),
        sa.Column('avg_workout_duration_min', sa.Float(), nullable=False, server_default='0'),
        sa.Column('best_one_rep_max_by_exercise', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('last_updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_user_stats_user_id', 'user_stats', ['user_id'])

    op.create_table(
        'user_stats_timeseries',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('period', sa.Enum('day','week','month', name='statsperiod'), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('workouts_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sets_logged', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reps_logged', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('volume', sa.Float(), nullable=False, server_default='0'),
        sa.Column('avg_duration_min', sa.Float(), nullable=False, server_default='0'),
    )
    op.create_index('ix_timeseries_user_period_start', 'user_stats_timeseries', ['user_id','period','period_start'])
    op.create_unique_constraint('ux_user_period_start', 'user_stats_timeseries', ['user_id','period','period_start'])

    op.create_table(
        'workout_stats_event',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workout_session_id', sa.Integer(), sa.ForeignKey('workout_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('processed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_event_user_id', 'workout_stats_event', ['user_id'])
    op.create_index('ix_event_session_id', 'workout_stats_event', ['workout_session_id'])
    op.create_unique_constraint('ux_event_user_session', 'workout_stats_event', ['user_id','workout_session_id'])


def downgrade():
    op.drop_constraint('ux_event_user_session', 'workout_stats_event', type_='unique')
    op.drop_index('ix_event_session_id', table_name='workout_stats_event')
    op.drop_index('ix_event_user_id', table_name='workout_stats_event')
    op.drop_table('workout_stats_event')

    op.drop_constraint('ux_user_period_start', 'user_stats_timeseries', type_='unique')
    op.drop_index('ix_timeseries_user_period_start', table_name='user_stats_timeseries')
    op.drop_table('user_stats_timeseries')

    op.drop_index('ix_user_stats_user_id', table_name='user_stats')
    op.drop_table('user_stats')

    op.execute("DROP TYPE IF EXISTS statsperiod")
