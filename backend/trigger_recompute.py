"""
Trigger stats recompute for tahaali user via API
"""
import requests
import json

# First, login to get token
login_url = "http://localhost:8000/api/auth/login"
recompute_url = "http://localhost:8000/api/stats/recompute"

# Login credentials
login_data = {
    "email": "tahaali@gmail.com",
    "password": "test123"  # Update with actual password
}

print("Logging in...")
response = requests.post(login_url, json=login_data)

if response.status_code == 200:
    token = response.json()["token"]
    print("✅ Login successful!")
    
    # Trigger recompute
    print("\nTriggering stats recompute...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(recompute_url, headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Stats recomputed successfully!")
        print("\nNew PR values:")
        print("=" * 60)
        
        prs = stats.get("bestOneRepMaxByExercise", {})
        for exercise, weight_lbs in prs.items():
            weight_kg = weight_lbs / 2.20462
            print(f"{exercise}: {weight_lbs:.2f} lbs = {weight_kg:.2f} kg")
    else:
        print(f"❌ Failed to recompute: {response.status_code}")
        print(response.text)
else:
    print(f"❌ Login failed: {response.status_code}")
    print(response.text)
