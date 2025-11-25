"""
Comprehensive Workout Logging Test Suite
Tests the complete workout flow for multiple users
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Test results storage
test_results = []

def log_test(test_name, passed, message=""):
    """Log test result"""
    status = "[PASS]" if passed else "[FAIL]"
    test_results.append(f"{status} | {test_name} | {message}")
    print(f"{status} | {test_name}")
    if message:
        print(f"   -> {message}")

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    for result in test_results:
        print(result)
    passed = sum(1 for r in test_results if "[PASS]" in r)
    total = len(test_results)
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*80)

# ============ User Setup ============

def register_user(email, password, name):
    """Register a new user"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": email,
            "password": password,
            "name": name
        })
        if response.status_code >= 400:
            print(f"   ERROR: {response.text}")
        return response
    except Exception as e:
        print(f"   EXCEPTION: {str(e)}")
        raise

def login_user(email, password):
    """Login and get JWT token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            data = response.json()
            if "data" in data and "access_token" in data["data"]:
                return data["data"]["access_token"]
            else:
                print(f"   ERROR: Unexpected response format: {data}")
                return None
        else:
            print(f"   ERROR: Status {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        print(f"   EXCEPTION: {str(e)}")
        return None

# ============ Workout Tests ============

def test_start_workout(token, template_id=None):
    """Test starting a workout"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"name": "Test Workout"}
    if template_id:
        payload["template_id"] = template_id
    
    response = requests.post(
        f"{BASE_URL}/api/workouts/start",
        json=payload,
        headers=headers
    )
    return response

def test_get_active_workout(token):
    """Test getting active workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/workouts/active", headers=headers)
    return response

def test_add_exercise(token, session_id, exercise_id):
    """Test adding exercise to workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/workouts/{session_id}/exercises",
        json={"exercise_id": exercise_id},
        headers=headers
    )
    return response

def test_add_set(token, workout_exercise_id, weight, reps, rpe=None, is_completed=True):
    """Test adding set to exercise"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"weight": weight, "reps": reps, "is_completed": is_completed}
    if rpe:
        payload["rpe"] = rpe
    
    response = requests.post(
        f"{BASE_URL}/api/workouts/exercises/{workout_exercise_id}/sets",
        json=payload,
        headers=headers
    )
    return response

def test_update_set(token, set_id, weight=None, reps=None, rpe=None, is_completed=None):
    """Test updating a set"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {}
    if weight is not None:
        payload["weight"] = weight
    if reps is not None:
        payload["reps"] = reps
    if rpe is not None:
        payload["rpe"] = rpe
    if is_completed is not None:
        payload["is_completed"] = is_completed
    
    response = requests.put(
        f"{BASE_URL}/api/workouts/sets/{set_id}",
        json=payload,
        headers=headers
    )
    return response

def test_delete_set(token, set_id):
    """Test deleting a set"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/api/workouts/sets/{set_id}", headers=headers)
    return response

def test_remove_exercise(token, workout_exercise_id):
    """Test removing exercise from workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(
        f"{BASE_URL}/api/workouts/exercises/{workout_exercise_id}",
        headers=headers
    )
    return response

def test_update_workout(token, session_id, name=None, notes=None):
    """Test updating workout metadata"""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {}
    if name:
        payload["name"] = name
    if notes:
        payload["notes"] = notes
    
    response = requests.put(
        f"{BASE_URL}/api/workouts/{session_id}",
        json=payload,
        headers=headers
    )
    return response

def test_finish_workout(token, session_id):
    """Test finishing a workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/workouts/{session_id}/finish",
        headers=headers
    )
    return response

def test_get_all_workouts(token, status_filter=None):
    """Test getting all workouts"""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}/api/workouts/"
    if status_filter:
        url += f"?status_filter={status_filter}"
    response = requests.get(url, headers=headers)
    return response

def test_get_workout_by_id(token, session_id):
    """Test getting specific workout"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/workouts/{session_id}", headers=headers)
    return response

def get_exercises(token):
    """Get available exercises"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/exercises/", headers=headers)
    return response

# ============ Main Test Flow ============

def run_comprehensive_tests():
    """Run comprehensive workout logging tests"""
    
    print("\n" + "="*80)
    print("COMPREHENSIVE WORKOUT LOGGING TEST SUITE")
    print("="*80 + "\n")
    
    # Test User Credentials - Using existing users
    user1_email = "user1@gmail.com"
    user2_email = "user2@gmail.com"
    password = "root"
    
    # ============ TEST 1: User Login (Skip Registration) ============
    # ============ TEST 1: User Login (Skip Registration) ============
    print("\n[LOGIN] TEST 1: User Login")
    print("-" * 80)
    
    token1 = login_user(user1_email, password)
    log_test("Login User 1", token1 is not None, "Got JWT token")
    
    token2 = login_user(user2_email, password)
    log_test("Login User 2", token2 is not None, "Got JWT token")
    
    if not token1 or not token2:
        print("\n[ERROR] Cannot proceed without valid tokens")
        return
    
    # ============ TEST 3: Get Available Exercises ============
    print("\n TEST 3: Get Available Exercises")
    print("-" * 80)
    
    response = get_exercises(token1)
    log_test("Get Exercises", response.status_code == 200, f"Status: {response.status_code}")
    
    exercises = response.json()["data"]
    exercise_ids = [ex["id"] for ex in exercises[:3]]  # Get first 3 exercises
    log_test("Exercises Available", len(exercise_ids) >= 3, f"Found {len(exercises)} exercises")
    
    # ============ TEST 4: Start Workout (User 1) ============
    print("\n TEST 4: Start Workout - User 1")
    print("-" * 80)
    
    response = test_start_workout(token1)
    log_test("Start Workout User 1", response.status_code == 201, f"Status: {response.status_code}")
    
    if response.status_code != 201:
        print(f"   ERROR Response: {response.text[:200]}")
        print("\n[ERROR] Cannot start workout, stopping tests")
        return
    
    workout1_data = response.json()["data"]
    session1_id = workout1_data["id"]
    log_test("Workout Session Created", session1_id is not None, f"Session ID: {session1_id}")
    
    # ============ TEST 5: Get Active Workout ============
    print("\n TEST 5: Get Active Workout")
    print("-" * 80)
    
    response = test_get_active_workout(token1)
    log_test("Get Active Workout", response.status_code == 200, f"Status: {response.status_code}")
    
    active_workout = response.json()["data"]
    log_test("Active Workout Exists", active_workout is not None and active_workout["id"] == session1_id, 
             f"Active: {active_workout['id'] if active_workout else 'None'}")
    
    # ============ TEST 6: Add Exercises to Workout ============
    print("\n TEST 6: Add Exercises to Workout")
    print("-" * 80)
    
    workout_exercise_ids = []
    for i, exercise_id in enumerate(exercise_ids):
        response = test_add_exercise(token1, session1_id, exercise_id)
        log_test(f"Add Exercise {i+1}", response.status_code == 201, f"Exercise ID: {exercise_id}")
        if response.status_code == 201:
            workout_exercise_ids.append(response.json()["data"]["id"])
    
    log_test("All Exercises Added", len(workout_exercise_ids) == 3, 
             f"Added {len(workout_exercise_ids)}/3 exercises")
    
    # ============ TEST 7: Add Sets to Exercises ============
    print("\n TEST 7: Add Sets to Exercises")
    print("-" * 80)
    
    set_ids = []
    if workout_exercise_ids:
        # Exercise 1: 3 sets
        for i in range(3):
            response = test_add_set(token1, workout_exercise_ids[0], 
                                  weight=135 + (i*10), reps=10-i, rpe=7+i)
            log_test(f"Add Set {i+1} to Exercise 1", response.status_code == 201, 
                    f"Weight: {135+(i*10)}, Reps: {10-i}")
            if response.status_code == 201:
                set_ids.append(response.json()["data"]["id"])
        
        # Exercise 2: 4 sets
        for i in range(4):
            response = test_add_set(token1, workout_exercise_ids[1], 
                                  weight=95 + (i*5), reps=12-i, rpe=6+i)
            log_test(f"Add Set {i+1} to Exercise 2", response.status_code == 201, 
                    f"Weight: {95+(i*5)}, Reps: {12-i}")
            if response.status_code == 201:
                set_ids.append(response.json()["data"]["id"])
        
        # Exercise 3: 3 sets
        for i in range(3):
            response = test_add_set(token1, workout_exercise_ids[2], 
                                  weight=25 + (i*5), reps=15-i, rpe=7+i)
            log_test(f"Add Set {i+1} to Exercise 3", response.status_code == 201, 
                    f"Weight: {25+(i*5)}, Reps: {15-i}")
            if response.status_code == 201:
                set_ids.append(response.json()["data"]["id"])
    
    log_test("All Sets Added", len(set_ids) == 10, f"Added {len(set_ids)}/10 sets")
    
    # ============ TEST 8: Update Set ============
    print("\n TEST 8: Update Set")
    print("-" * 80)
    
    if set_ids:
        response = test_update_set(token1, set_ids[0], weight=150, reps=8, rpe=9)
        log_test("Update Set", response.status_code == 200, "Updated weight, reps, RPE")
    
    # ============ TEST 9: Delete Set ============
    print("\n TEST 9: Delete Set")
    print("-" * 80)
    
    if len(set_ids) > 1:
        response = test_delete_set(token1, set_ids[-1])
        log_test("Delete Set", response.status_code == 200, f"Deleted set ID: {set_ids[-1]}")
    
    # ============ TEST 10: Update Workout Metadata ============
    print("\n TEST 10: Update Workout Metadata")
    print("-" * 80)
    
    response = test_update_workout(token1, session1_id, 
                                  name="Push Day - Chest & Triceps",
                                  notes="Felt strong today, good pump!")
    log_test("Update Workout Name & Notes", response.status_code == 200, 
            "Updated name and notes")
    
    # ============ TEST 11: Get Workout Details ============
    print("\n TEST 11: Get Workout Details")
    print("-" * 80)
    
    response = test_get_workout_by_id(token1, session1_id)
    log_test("Get Workout by ID", response.status_code == 200, f"Session ID: {session1_id}")
    
    if response.status_code == 200:
        workout_details = response.json()["data"]
        log_test("Workout Has Exercises", len(workout_details["workout_exercises"]) == 3, 
                f"Found {len(workout_details['workout_exercises'])} exercises")
        
        total_sets = sum(len(ex["workout_sets"]) for ex in workout_details["workout_exercises"])
        log_test("Workout Has Sets", total_sets == 9, f"Found {total_sets} sets (after delete)")
    
    # ============ TEST 12: Start Second Workout (User 2) ============
    print("\n TEST 12: Start Workout - User 2")
    print("-" * 80)
    
    response = test_start_workout(token2)
    log_test("Start Workout User 2", response.status_code == 201, f"Status: {response.status_code}")
    
    session2_id = response.json()["data"]["id"]
    
    # Add one exercise and sets for User 2
    if exercise_ids:
        response = test_add_exercise(token2, session2_id, exercise_ids[0])
        if response.status_code == 201:
            we_id = response.json()["data"]["id"]
            test_add_set(token2, we_id, weight=100, reps=10, rpe=7)
            test_add_set(token2, we_id, weight=105, reps=8, rpe=8)
    
    # ============ TEST 13: Finish Workouts ============
    print("\n TEST 13: Finish Workouts")
    print("-" * 80)
    
    response = test_finish_workout(token1, session1_id)
    log_test("Finish Workout User 1", response.status_code == 200, f"Status: {response.status_code}")
    
    if response.status_code == 200:
        summary = response.json()["data"]
        log_test("Workout Summary Generated", "total_volume" in summary, 
                f"Volume: {summary.get('total_volume', 0):.1f} lbs")
        log_test("Duration Calculated", summary.get("duration_seconds", 0) > 0, 
                f"Duration: {summary.get('duration_seconds', 0)} seconds")
        log_test("Status Changed to Completed", summary.get("status") == "completed", 
                f"Status: {summary.get('status')}")
    
    response = test_finish_workout(token2, session2_id)
    log_test("Finish Workout User 2", response.status_code == 200, f"Status: {response.status_code}")
    
    # ============ TEST 14: Get All Workouts ============
    print("\n TEST 14: Get All Workouts")
    print("-" * 80)
    
    response = test_get_all_workouts(token1)
    log_test("Get All Workouts User 1", response.status_code == 200, f"Status: {response.status_code}")
    
    if response.status_code == 200:
        workouts = response.json()["data"]
        log_test("User 1 Has Workouts", len(workouts) >= 1, f"Found {len(workouts)} workout(s)")
    
    response = test_get_all_workouts(token2)
    log_test("Get All Workouts User 2", response.status_code == 200, f"Status: {response.status_code}")
    
    if response.status_code == 200:
        workouts = response.json()["data"]
        log_test("User 2 Has Workouts", len(workouts) >= 1, f"Found {len(workouts)} workout(s)")
    
    # ============ TEST 15: Filter Workouts by Status ============
    print("\n TEST 15: Filter Workouts by Status")
    print("-" * 80)
    
    response = test_get_all_workouts(token1, status_filter="completed")
    log_test("Filter Completed Workouts", response.status_code == 200, 
            f"Found {len(response.json()['data'])} completed")
    
    response = test_get_all_workouts(token1, status_filter="active")
    log_test("Filter Active Workouts", response.status_code == 200, 
            f"Found {len(response.json()['data'])} active")
    
    # ============ TEST 16: Security - Cross-User Access ============
    print("\n TEST 16: Security - Cross-User Access")
    print("-" * 80)
    
    # Try to access User 1's workout with User 2's token
    response = test_get_workout_by_id(token2, session1_id)
    log_test("Prevent Cross-User Access", response.status_code == 403, 
            f"Status: {response.status_code} (should be 403)")
    
    # ============ TEST 17: Edge Cases ============
    print("\n TEST 17: Edge Cases")
    print("-" * 80)
    
    # Try to finish already finished workout
    response = test_finish_workout(token1, session1_id)
    log_test("Prevent Double Finish", response.status_code == 400, 
            f"Status: {response.status_code} (should be 400)")
    
    # Try to add exercise to finished workout
    if exercise_ids:
        response = test_add_exercise(token1, session1_id, exercise_ids[0])
        log_test("Prevent Adding to Finished Workout", response.status_code == 400, 
                f"Status: {response.status_code} (should be 400)")
    
    # Print final summary
    print_summary()

if __name__ == "__main__":
    try:
        run_comprehensive_tests()
    except Exception as e:
        print(f"\n[ERROR] TEST SUITE ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

