"""
Test script for new live workout API endpoints
Run: python test_live_workout.py
"""
import requests
import json

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test credentials (adjust as needed)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def login():
    """Login and get access token"""
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("data", {}).get("access_token")
        print(f"✓ Login successful")
        return token
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(response.text)
        return None


def get_headers(token):
    """Get authorization headers"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def test_start_empty_workout(token):
    """Test starting an empty workout"""
    print("\n--- Test: Start Empty Workout ---")
    
    response = requests.post(
        f"{API_BASE}/live-workout/start",
        headers=get_headers(token),
        json={"workout_name": "Test Workout"}
    )
    
    if response.status_code == 201:
        data = response.json()
        workout = data.get("data")
        print(f"✓ Workout started successfully")
        print(f"  ID: {workout.get('id')}")
        print(f"  Workout Number: {workout.get('workoutNumber')}")
        print(f"  Name: {workout.get('workoutName')}")
        print(f"  Start Time: {workout.get('startTime')}")
        return workout
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None


def test_get_active_workout(token):
    """Test getting active workout"""
    print("\n--- Test: Get Active Workout ---")
    
    response = requests.get(
        f"{API_BASE}/live-workout/active",
        headers=get_headers(token)
    )
    
    if response.status_code == 200:
        data = response.json()
        workout = data.get("data")
        if workout:
            print(f"✓ Active workout found")
            print(f"  ID: {workout.get('id')}")
            print(f"  Exercises: {len(workout.get('exercises', []))}")
            return workout
        else:
            print(f"✓ No active workout")
            return None
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None


def test_add_exercise(token, workout_id, exercise_id=1):
    """Test adding an exercise to workout"""
    print("\n--- Test: Add Exercise ---")
    
    response = requests.post(
        f"{API_BASE}/live-workout/{workout_id}/exercises",
        headers=get_headers(token),
        json={"exercise_id": exercise_id, "position": 0}
    )
    
    if response.status_code == 201:
        data = response.json()
        exercise = data.get("data")
        print(f"✓ Exercise added")
        print(f"  ID: {exercise.get('id')}")
        print(f"  Name: {exercise.get('name')}")
        return exercise
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None


def test_add_set(token, workout_exercise_id):
    """Test adding a set to an exercise"""
    print("\n--- Test: Add Set ---")
    
    response = requests.post(
        f"{API_BASE}/live-workout/exercises/{workout_exercise_id}/sets",
        headers=get_headers(token),
        json={
            "reps": "10",
            "weight": "100",
            "rpe": 8,
            "completed": False,
            "isWarmup": False
        }
    )
    
    if response.status_code == 201:
        data = response.json()
        workout_set = data.get("data")
        print(f"✓ Set added")
        print(f"  ID: {workout_set.get('id')}")
        print(f"  Reps: {workout_set.get('reps')}")
        print(f"  Weight: {workout_set.get('weight')}")
        return workout_set
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None


def test_update_set(token, set_id):
    """Test updating a set"""
    print("\n--- Test: Update Set ---")
    
    response = requests.put(
        f"{API_BASE}/live-workout/sets/{set_id}",
        headers=get_headers(token),
        json={
            "reps": "12",
            "weight": "110",
            "rpe": 9,
            "completed": True,
            "isWarmup": False
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        workout_set = data.get("data")
        print(f"✓ Set updated")
        print(f"  Reps: {workout_set.get('reps')}")
        print(f"  Weight: {workout_set.get('weight')}")
        print(f"  Completed: {workout_set.get('completed')}")
        return workout_set
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None


def test_finish_workout(token, workout_id):
    """Test finishing a workout"""
    print("\n--- Test: Finish Workout ---")
    
    response = requests.post(
        f"{API_BASE}/live-workout/{workout_id}/finish",
        headers=get_headers(token)
    )
    
    if response.status_code == 200:
        data = response.json()
        summary = data.get("data")
        print(f"✓ Workout finished")
        print(f"  Total Exercises: {summary.get('total_exercises')}")
        print(f"  Total Sets: {summary.get('total_sets')}")
        print(f"  Elapsed Seconds: {summary.get('elapsed_seconds')}")
        return summary
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None


def test_start_from_template(token, template_id):
    """Test starting workout from a template"""
    print("\n--- Test: Start From Template ---")
    
    response = requests.post(
        f"{API_BASE}/live-workout/start",
        headers=get_headers(token),
        json={
            "template_id": template_id,
            "workout_name": "Template-based Workout"
        }
    )
    
    if response.status_code == 201:
        data = response.json()
        workout = data.get("data")
        print(f"✓ Workout started from template")
        print(f"  ID: {workout.get('id')}")
        print(f"  Exercises: {len(workout.get('exercises', []))}")
        return workout
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None


def main():
    print("=" * 50)
    print("Live Workout API Test Suite")
    print("=" * 50)
    
    # Login
    token = login()
    if not token:
        print("\nCannot proceed without authentication")
        return
    
    # Test 1: Start empty workout
    workout = test_start_empty_workout(token)
    if not workout:
        print("\nCannot proceed without active workout")
        return
    
    workout_id = workout.get("id")
    
    # Test 2: Get active workout
    active = test_get_active_workout(token)
    
    # Test 3: Add exercise
    exercise = test_add_exercise(token, workout_id, exercise_id=1)
    if exercise:
        exercise_id = int(exercise.get("id"))
        
        # Test 4: Add set
        workout_set = test_add_set(token, exercise_id)
        if workout_set:
            set_id = workout_set.get("id")
            
            # Test 5: Update set
            test_update_set(token, set_id)
    
    # Test 6: Finish workout
    test_finish_workout(token, workout_id)
    
    # Test 7: Verify no active workout
    test_get_active_workout(token)
    
    print("\n" + "=" * 50)
    print("Test suite completed!")
    print("=" * 50)


if __name__ == "__main__":
    main()
