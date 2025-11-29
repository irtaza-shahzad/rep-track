from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE '%stats%' 
        ORDER BY tablename
    """)).fetchall()
    
    print("Stats-related tables in database:")
    print("=" * 60)
    
    if result:
        for row in result:
            print(f"  ✅ {row[0]}")
    else:
        print("  ❌ No stats tables found!")
