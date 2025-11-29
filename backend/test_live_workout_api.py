"""Test live workout API endpoints"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login():
    """Login and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "user1@gmail.com",
        "password": "root"
    })
    if response.status_code == 200:
        token = response.json()["data"]["access_token"]
        print("✓ Login successful")
        return token
    else:
        print(f"✗ Login failed: {response.status_code}")
        return None

def test_get_active_workout(token):
    """Check for active workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/workouts/active", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Get active workout successful")
        print(f"  Active workout: {data}")
        return data
    elif response.status_code == 404:
        print("✓ No active workout (as expected)")
        return None
    else:
        print(f"✗ Get active workout failed: {response.status_code} - {response.text}")
        return None

def test_start_workout(token):
    """Start a new workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/workouts/active", 
                            headers=headers,
                            json={"workout_name": "Test Workout"})
    
    if response.status_code == 201:
        data = response.json()
        print("✓ Start workout successful")
        print(f"  Workout ID: {data['id']}")
        print(f"  Workout Number: {data['workout_number']}")
        return data
    else:
        print(f"✗ Start workout failed: {response.status_code} - {response.text}")
        return None

def test_add_exercise(token, exercise_name="Barbell Bench Press"):
    """Add exercise to active workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/workouts/active/exercises",
                            headers=headers,
                            json={"exercise_name": exercise_name})
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Add exercise '{exercise_name}' successful")
        print(f"  Exercise ID: {data['id']}")
        return data
    else:
        print(f"✗ Add exercise failed: {response.status_code} - {response.text}")
        return None

def test_add_set(token, exercise_id):
    """Add a set to an exercise"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/workouts/active/exercises/{exercise_id}/sets",
                            headers=headers,
                            json={
                                "reps": "10",
                                "weight": "135",
                                "completed": True
                            })
    
    if response.status_code == 201:
        data = response.json()
        print(f"✓ Add set successful (Set ID: {data['id']})")
        return data
    else:
        print(f"✗ Add set failed: {response.status_code} - {response.text}")
        return None

def test_finish_workout(token):
    """Finish the active workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/api/workouts/active/finish",
                            headers=headers,
                            json={"workout_name": "Completed Test Workout"})
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Finish workout successful")
        print(f"  Total volume: {data.get('total_volume', 0)}")
        print(f"  Total sets: {data.get('total_sets', 0)}")
        return data
    else:
        print(f"✗ Finish workout failed: {response.status_code} - {response.text}")
        return None

def main():
    print("=" * 60)
    print("LIVE WORKOUT API INTEGRATION TEST")
    print("=" * 60)
    
    # Step 1: Login
    print("\n[1] Testing Login...")
    token = test_login()
    if not token:
        print("Cannot proceed without token")
        return
    
    # Step 2: Check for active workout
    print("\n[2] Checking for active workout...")
    active = test_get_active_workout(token)
    
    if active and active.get('is_active'):
        print(f"⚠ Active workout found (ID: {active['id']}). Please finish or cancel it first.")
        return
    
    # Step 3: Start new workout
    print("\n[3] Starting new workout...")
    workout = test_start_workout(token)
    if not workout:
        return
    
    # Step 4: Add exercise
    print("\n[4] Adding exercise...")
    exercise = test_add_exercise(token)
    if not exercise:
        return
    
    # Step 5: Add sets
    print("\n[5] Adding sets...")
    test_add_set(token, exercise['id'])
    test_add_set(token, exercise['id'])
    test_add_set(token, exercise['id'])
    
    # Step 6: Get active workout again to see updated state
    print("\n[6] Checking updated active workout...")
    test_get_active_workout(token)
    
    # Step 7: Finish workout
    print("\n[7] Finishing workout...")
    test_finish_workout(token)
    
    # Step 8: Verify no active workout
    print("\n[8] Verifying no active workout...")
    test_get_active_workout(token)
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
