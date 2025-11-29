from app.core.database import engine
from sqlalchemy import text

# Create stats tables manually
with engine.begin() as conn:
    # Create enum type first
    conn.execute(text("CREATE TYPE statsperiod AS ENUM ('day','week','month')"))
    
    # Create user_stats table
    conn.execute(text("""
        CREATE TABLE user_stats (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            total_workouts INTEGER NOT NULL DEFAULT 0,
            total_sets INTEGER NOT NULL DEFAULT 0,
            total_reps INTEGER NOT NULL DEFAULT 0,
            total_volume FLOAT NOT NULL DEFAULT 0,
            avg_workout_duration_min FLOAT NOT NULL DEFAULT 0,
            best_one_rep_max_by_exercise JSONB NOT NULL DEFAULT '{}'::jsonb,
            last_updated_at TIMESTAMP
        )
    """))
    conn.execute(text("CREATE INDEX ix_user_stats_user_id ON user_stats(user_id)"))
    
    # Create user_stats_timeseries table
    conn.execute(text("""
        CREATE TABLE user_stats_timeseries (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            period statsperiod NOT NULL,
            period_start DATE NOT NULL,
            workouts_completed INTEGER NOT NULL DEFAULT 0,
            sets_logged INTEGER NOT NULL DEFAULT 0,
            reps_logged INTEGER NOT NULL DEFAULT 0,
            volume FLOAT NOT NULL DEFAULT 0,
            avg_duration_min FLOAT NOT NULL DEFAULT 0
        )
    """))
    conn.execute(text("CREATE INDEX ix_timeseries_user_period_start ON user_stats_timeseries(user_id, period, period_start)"))
    conn.execute(text("CREATE UNIQUE INDEX ux_user_period_start ON user_stats_timeseries(user_id, period, period_start)"))
    
    # Create workout_stats_event table
    conn.execute(text("""
        CREATE TABLE workout_stats_event (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            workout_session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
            processed INTEGER NOT NULL DEFAULT 0,
            processed_at TIMESTAMP,
            created_at TIMESTAMP
        )
    """))
    conn.execute(text("CREATE INDEX ix_event_user_id ON workout_stats_event(user_id)"))
    conn.execute(text("CREATE INDEX ix_event_session_id ON workout_stats_event(workout_session_id)"))
    conn.execute(text("CREATE UNIQUE INDEX ux_event_user_session ON workout_stats_event(user_id, workout_session_id)"))
    
    print("✅ Stats tables created successfully!")
