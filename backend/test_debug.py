"""Debug active workout issue"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Login
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "user1@gmail.com",
    "password": "root"
})

token = response.json()["data"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get active workout
print("Getting active workout...")
response = requests.get(f"{BASE_URL}/api/workouts/active", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2, default=str)}")

# Start a new workout (should fail if one exists)
print("\nStarting new workout...")
response = requests.post(
    f"{BASE_URL}/api/workouts/start",
    json={"name": "Test Workout 2"},
    headers=headers
)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

# Try adding exercise
if response.status_code == 201:
    session_id = response.json()["data"]["id"]
    print(f"\nAdding exercise to session {session_id}...")
    response = requests.post(
        f"{BASE_URL}/api/workouts/{session_id}/exercises",
        json={"exercise_id": 1},
        headers=headers
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
