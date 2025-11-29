from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(
        text("SELECT best_one_rep_max_by_exercise FROM user_stats WHERE user_id = (SELECT id FROM users WHERE email = :email)"),
        {'email': 'john.doe@fitness.com'}
    )
    row = result.fetchone()
    
    if row and row[0]:
        prs = row[0]
        print("\n" + "="*80)
        print("JOHN DOE'S STATS SUMMARY")
        print("="*80)
        print("\nPersonal Records:")
        for k, v in sorted(prs.items(), key=lambda x: x[1], reverse=True):
            print(f"  {k}: {v:.1f} lbs")
        
        # Get workout frequency by month
        print("\n" + "="*80)
        print("WORKOUT FREQUENCY BY MONTH")
        print("="*80)
        result = conn.execute(
            text("""
                SELECT 
                    TO_CHAR(period_start, 'YYYY-MM') as month,
                    workouts_completed,
                    ROUND(volume::numeric, 0) as volume,
                    ROUND(avg_duration_min::numeric, 1) as avg_duration
                FROM user_stats_timeseries
                WHERE user_id = (SELECT id FROM users WHERE email = :email)
                AND period = 'month'
                ORDER BY period_start
            """),
            {'email': 'john.doe@fitness.com'}
        )
        
        for row in result:
            print(f"{row[0]}: {row[1]} workouts, {row[2]:,.0f} lbs volume, {row[3]} min avg")
        
        print("="*80)
