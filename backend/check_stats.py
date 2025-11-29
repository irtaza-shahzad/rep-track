from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

# Check if any stats exist
query = text("""
    SELECT u.id, u.email, 
           COUNT(ws.id) as workout_count,
           us.total_workouts as stats_workouts,
           us.total_sets,
           us.total_volume,
           us.last_updated_at
    FROM users u
    LEFT JOIN workout_sessions ws ON ws.user_id = u.id AND ws.is_completed = true
    LEFT JOIN user_stats us ON us.user_id = u.id
    GROUP BY u.id, u.email, us.total_workouts, us.total_sets, us.total_volume, us.last_updated_at
    HAVING COUNT(ws.id) > 0
    ORDER BY COUNT(ws.id) DESC
    LIMIT 5
""")

result = db.execute(query)
users = result.fetchall()

print("\n" + "="*80)
print("TOP USERS WITH WORKOUT HISTORY")
print("="*80)

for user in users:
    print(f"\n📊 User ID: {user.id} | Email: {user.email}")
    print(f"   ├─ Completed Workouts: {user.workout_count}")
    if user.stats_workouts is not None:
        print(f"   ├─ Stats Computed: ✅ YES")
        print(f"   ├─ Stats Workouts: {user.stats_workouts}")
        print(f"   ├─ Total Sets: {user.total_sets}")
        print(f"   ├─ Total Volume: {user.total_volume:.2f}")
        print(f"   └─ Last Updated: {user.last_updated_at}")
    else:
        print(f"   └─ Stats Computed: ❌ NO (need to run stats processing)")

print("\n" + "="*80)
print("\n✨ RECOMMENDED TEST USERS:")
print("   • user4@gmail.com (ID: 12) - 193 workouts")
print("   • user1@gmail.com (ID: 9) - 177 workouts")
print("   • user7@gmail.com (ID: 15) - 174 workouts")
print("\n💡 Login with any of these users to see rich stats and graphs!")
print("="*80 + "\n")

db.close()
