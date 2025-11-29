from sqlalchemy import create_engine, text
from app.core.config import settings
from datetime import datetime, timedelta

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Get user ID
    user_result = conn.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {'email': 'testuser2years@test.com'}
    )
    user_id = user_result.fetchone()[0]
    
    # Check workouts in different date ranges
    ranges = [
        ('Last 30 days', 30),
        ('Last 90 days', 90),
        ('Last 180 days', 180),
        ('Last 365 days', 365)
    ]
    
    print("\n" + "="*80)
    print("WORKOUT CONSISTENCY ANALYSIS FOR testuser2years@test.com")
    print("="*80)
    
    for range_name, days in ranges:
        cutoff_date = datetime.now() - timedelta(days=days)
        cutoff_ms = int(cutoff_date.timestamp() * 1000)
        
        result = conn.execute(
            text("""
                SELECT COUNT(*) 
                FROM workout_sessions 
                WHERE user_id = :user_id 
                AND is_completed = true 
                AND start_time >= :cutoff_ms
            """),
            {'user_id': user_id, 'cutoff_ms': cutoff_ms}
        )
        actual_workouts = result.fetchone()[0]
        
        # Calculate expected workouts (4 per week)
        expected_workouts = (days / 7) * 4
        consistency = min(100, round((actual_workouts / expected_workouts) * 100))
        
        print(f"\n{range_name}:")
        print(f"  Days: {days}")
        print(f"  Expected workouts (4/week): {expected_workouts:.1f}")
        print(f"  Actual workouts: {actual_workouts}")
        print(f"  Consistency: {consistency}%")
        print(f"  Actual workout frequency: {(actual_workouts / (days / 7)):.1f} workouts/week")
    
    print("\n" + "="*80)
