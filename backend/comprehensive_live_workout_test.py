"""
Comprehensive Live Workout Module Test Suite
Tests all requirements from LIVE_WORKOUT_MODULE_SPECIFICATION.md
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "user1@gmail.com"
TEST_USER_PASSWORD = "root"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}✓ PASSED{Colors.END}" if passed else f"{Colors.RED}✗ FAILED{Colors.END}"
    print(f"\n{status} - {name}")
    if details:
        print(f"  {details}")

def print_section(title):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{Colors.END}")

# Global token storage
token = None
active_workout_id = None
exercise_id = None
set_id = None
template_id = None

def login():
    """Authenticate and get JWT token"""
    global token
    print_section("AUTHENTICATION")
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data["data"]["access_token"]
        print_test("User Authentication", True, f"Token obtained for {TEST_USER_EMAIL}")
        return True
    else:
        print_test("User Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def get_headers():
    """Get headers with JWT token"""
    return {"Authorization": f"Bearer {token}"}

def create_template():
    """Create a test template for workout"""
    global template_id
    print_section("TEMPLATE SETUP")
    
    response = requests.post(
        f"{BASE_URL}/api/templates",
        headers=get_headers(),
        json={
            "name": "Live Workout Test Template",
            "description": "Template for testing live workouts",
            "exercises": [
                {
                    "exercise_id": 1,  # Assuming exercise 1 exists (Bench Press from seed data)
                    "order_index": 0,
                    "target_sets": 3,
                    "target_reps": "8-10",
                    "target_weight": "100",
                    "rest_time": 90,
                    "notes": "Test exercise 1"
                },
                {
                    "exercise_id": 2,  # Assuming exercise 2 exists
                    "order_index": 1,
                    "target_sets": 4,
                    "target_reps": "12",
                    "target_weight": "50",
                    "rest_time": 60,
                    "notes": "Test exercise 2"
                }
            ]
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        template_id = data["data"]["id"]
        print_test("Template Creation", True, f"Template ID: {template_id}")
        return True
    else:
        print_test("Template Creation", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_start_empty_workout():
    """Test 1: Start workout from empty draft"""
    global active_workout_id
    print_section("TEST 1: Start Empty Draft Workout")
    
    response = requests.post(
        f"{BASE_URL}/api/live-workout/start",
        headers=get_headers(),
        json={}
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        active_workout_id = data["workout_id"]
        
        # Verify structure
        checks = [
            (data["workout_id"] is not None, "Workout ID present"),
            (data["start_time"] > 0, "Start time is valid epoch milliseconds"),
            (data["exercises"] == [], "Exercises list is empty"),
            (data["is_paused"] == False, "Workout is not paused"),
            (data["template_id"] is None, "No template ID for empty draft")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Start Empty Draft Workout", all_passed, details)
        return all_passed
    else:
        print_test("Start Empty Draft Workout", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_get_active_workout():
    """Test 2: Get active workout"""
    print_section("TEST 2: Get Active Workout")
    
    response = requests.get(
        f"{BASE_URL}/api/live-workout/active",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        checks = [
            (data["workout_id"] == active_workout_id, "Correct workout ID returned"),
            (data["start_time"] > 0, "Start time present"),
            (isinstance(data["exercises"], list), "Exercises is a list")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Get Active Workout", all_passed, details)
        return all_passed
    else:
        print_test("Get Active Workout", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_add_exercise():
    """Test 3: Add exercise to workout"""
    global exercise_id
    print_section("TEST 3: Add Exercise to Workout")
    
    response = requests.patch(
        f"{BASE_URL}/api/live-workout/exercise/add",
        headers=get_headers(),
        json={
            "exercise_id": 1,  # Bench Press
            "order_index": 0
        }
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        # Find the added exercise
        added_exercise = None
        for ex in data["exercises"]:
            if ex["exercise_id"] == 1:
                added_exercise = ex
                exercise_id = ex["id"]
                break
        
        checks = [
            (added_exercise is not None, "Exercise added to workout"),
            (added_exercise["exercise_id"] == 1 if added_exercise else False, "Correct exercise ID"),
            (added_exercise["order_index"] == 0 if added_exercise else False, "Correct order index"),
            (added_exercise["sets"] == [] if added_exercise else False, "Sets list initialized empty")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Add Exercise to Workout", all_passed, details)
        return all_passed
    else:
        print_test("Add Exercise to Workout", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_add_set():
    """Test 4: Add set to exercise"""
    global set_id
    print_section("TEST 4: Add Set to Exercise")
    
    response = requests.post(
        f"{BASE_URL}/api/live-workout/set",
        headers=get_headers(),
        json={
            "workout_exercise_id": exercise_id,
            "reps": "10",
            "weight": "100",
            "completed": True
        }
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        # Find the exercise and its sets
        target_exercise = None
        for ex in data["exercises"]:
            if ex["id"] == exercise_id:
                target_exercise = ex
                break
        
        if target_exercise and len(target_exercise["sets"]) > 0:
            added_set = target_exercise["sets"][0]
            set_id = added_set["id"]
            
            checks = [
                (added_set["reps"] == "10", "Correct reps value"),
                (added_set["weight"] == "100", "Correct weight value"),
                (added_set["completed"] == True, "Set marked as completed"),
                (added_set["set_number"] == 1, "Correct set number")
            ]
        else:
            checks = [(False, "Set not found in response")]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Add Set to Exercise", all_passed, details)
        return all_passed
    else:
        print_test("Add Set to Exercise", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_update_set():
    """Test 5: Update set data"""
    print_section("TEST 5: Update Set Data")
    
    response = requests.patch(
        f"{BASE_URL}/api/live-workout/set",
        headers=get_headers(),
        json={
            "set_id": set_id,
            "reps": "12",
            "weight": "105",
            "completed": True,
            "is_warmup": True
        }
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        # Find the updated set
        updated_set = None
        for ex in data["exercises"]:
            if ex["id"] == exercise_id:
                for s in ex["sets"]:
                    if s["id"] == set_id:
                        updated_set = s
                        break
        
        if updated_set:
            checks = [
                (updated_set["reps"] == "12", "Reps updated correctly"),
                (updated_set["weight"] == "105", "Weight updated correctly"),
                (updated_set["is_warmup"] == True, "Warmup flag updated")
            ]
        else:
            checks = [(False, "Updated set not found")]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Update Set Data", all_passed, details)
        return all_passed
    else:
        print_test("Update Set Data", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_pause_workout():
    """Test 6: Pause workout"""
    print_section("TEST 6: Pause Workout")
    
    response = requests.post(
        f"{BASE_URL}/api/live-workout/pause",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        checks = [
            (data["is_paused"] == True, "Workout is paused")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Pause Workout", all_passed, details)
        return all_passed
    else:
        print_test("Pause Workout", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_resume_workout():
    """Test 7: Resume workout"""
    print_section("TEST 7: Resume Workout")
    
    response = requests.post(
        f"{BASE_URL}/api/live-workout/resume",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        checks = [
            (data["is_paused"] == False, "Workout is resumed")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Resume Workout", all_passed, details)
        return all_passed
    else:
        print_test("Resume Workout", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_update_exercise():
    """Test 8: Update exercise details"""
    print_section("TEST 8: Update Exercise Details")
    
    response = requests.patch(
        f"{BASE_URL}/api/live-workout/exercise/update",
        headers=get_headers(),
        json={
            "workout_exercise_id": exercise_id,
            "notes": "Updated test notes"
        }
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        # Find the updated exercise
        updated_exercise = None
        for ex in data["exercises"]:
            if ex["id"] == exercise_id:
                updated_exercise = ex
                break
        
        if updated_exercise:
            checks = [
                (updated_exercise["notes"] == "Updated test notes", "Notes updated correctly")
            ]
        else:
            checks = [(False, "Updated exercise not found")]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Update Exercise Details", all_passed, details)
        return all_passed
    else:
        print_test("Update Exercise Details", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_delete_set():
    """Test 9: Delete set"""
    print_section("TEST 9: Delete Set")
    
    response = requests.delete(
        f"{BASE_URL}/api/live-workout/set?set_id={set_id}",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        # Verify set is deleted
        set_found = False
        for ex in data["exercises"]:
            if ex["id"] == exercise_id:
                for s in ex["sets"]:
                    if s["id"] == set_id:
                        set_found = True
                        break
        
        checks = [
            (not set_found, "Set successfully deleted")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Delete Set", all_passed, details)
        return all_passed
    else:
        print_test("Delete Set", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_delete_exercise():
    """Test 10: Delete exercise"""
    print_section("TEST 10: Delete Exercise")
    
    response = requests.delete(
        f"{BASE_URL}/api/live-workout/exercise/remove?workout_exercise_id={exercise_id}",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        
        # Verify exercise is deleted
        exercise_found = False
        for ex in data["exercises"]:
            if ex["id"] == exercise_id:
                exercise_found = True
                break
        
        checks = [
            (not exercise_found, "Exercise successfully deleted")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Delete Exercise", all_passed, details)
        return all_passed
    else:
        print_test("Delete Exercise", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_complete_workout():
    """Test 11: Complete workout"""
    print_section("TEST 11: Complete Workout")
    
    response = requests.post(
        f"{BASE_URL}/api/live-workout/complete",
        headers=get_headers()
    )
    
    if response.status_code == 200:
        data = response.json()
        
        checks = [
            (data["message"] == "Workout completed successfully", "Success message received")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Complete Workout", all_passed, details)
        
        # Verify no active workout
        response2 = requests.get(
            f"{BASE_URL}/api/live-workout/active",
            headers=get_headers()
        )
        
        no_active = response2.status_code == 404
        print_test("Verify No Active Workout After Completion", no_active)
        
        return all_passed and no_active
    else:
        print_test("Complete Workout", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_start_from_template():
    """Test 12: Start workout from template"""
    global active_workout_id, exercise_id
    print_section("TEST 12: Start Workout from Template")
    
    response = requests.post(
        f"{BASE_URL}/api/live-workout/start",
        headers=get_headers(),
        json={"template_id": template_id}
    )
    
    if response.status_code == 200:
        data = response.json()["data"]
        active_workout_id = data["workout_id"]
        
        checks = [
            (data["template_id"] == template_id, "Correct template ID"),
            (len(data["exercises"]) == 2, "Exercises copied from template"),
            (data["exercises"][0]["exercise_id"] == 1, "First exercise correct"),
            (data["exercises"][1]["exercise_id"] == 2, "Second exercise correct")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Start Workout from Template", all_passed, details)
        return all_passed
    else:
        print_test("Start Workout from Template", False, f"Status: {response.status_code}, Response: {response.text}")
        return False

def test_prevent_multiple_active():
    """Test 13: Prevent multiple active workouts"""
    print_section("TEST 13: Prevent Multiple Active Workouts")
    
    response = requests.post(
        f"{BASE_URL}/api/live-workout/start",
        headers=get_headers(),
        json={}
    )
    
    if response.status_code == 400:
        data = response.json()
        checks = [
            ("already have an active workout" in data.get("message", "").lower(), "Correct error message")
        ]
        
        all_passed = all(check[0] for check in checks)
        details = "\n  ".join([f"{'✓' if c[0] else '✗'} {c[1]}" for c in checks])
        print_test("Prevent Multiple Active Workouts", all_passed, details)
        return all_passed
    else:
        print_test("Prevent Multiple Active Workouts", False, f"Expected 400, got {response.status_code}")
        return False

def test_authentication_required():
    """Test 14: Authentication required on all endpoints"""
    print_section("TEST 14: Authentication Required")
    
    endpoints = [
        ("GET", f"{BASE_URL}/api/live-workout/active"),
        ("POST", f"{BASE_URL}/api/live-workout/start"),
        ("POST", f"{BASE_URL}/api/live-workout/pause"),
        ("POST", f"{BASE_URL}/api/live-workout/resume"),
        ("POST", f"{BASE_URL}/api/live-workout/complete"),
    ]
    
    results = []
    for method, url in endpoints:
        if method == "GET":
            response = requests.get(url)
        else:
            response = requests.post(url, json={})
        
        results.append(response.status_code == 401)
    
    all_passed = all(results)
    details = f"All {len(endpoints)} endpoints require authentication"
    print_test("Authentication Required", all_passed, details)
    return all_passed

def cleanup():
    """Clean up test data"""
    print_section("CLEANUP")
    
    # Complete the active workout if exists
    requests.post(
        f"{BASE_URL}/api/live-workout/complete",
        headers=get_headers()
    )
    
    # Delete test template
    if template_id:
        requests.delete(
            f"{BASE_URL}/api/templates/{template_id}",
            headers=get_headers()
        )
    
    print_test("Cleanup", True, "Test data cleaned up")

def main():
    """Run all tests"""
    print(f"\n{Colors.YELLOW}{'='*60}")
    print("COMPREHENSIVE LIVE WORKOUT MODULE TEST SUITE")
    print(f"{'='*60}{Colors.END}")
    
    results = []
    
    # Authentication
    if not login():
        print(f"\n{Colors.RED}Authentication failed. Cannot proceed with tests.{Colors.END}")
        return
    
    # Setup
    if not create_template():
        print(f"\n{Colors.YELLOW}Template creation failed. Some tests may be affected.{Colors.END}")
    
    # Run all tests
    try:
        results.append(("Start Empty Draft Workout", test_start_empty_workout()))
        results.append(("Get Active Workout", test_get_active_workout()))
        results.append(("Add Exercise", test_add_exercise()))
        results.append(("Add Set", test_add_set()))
        results.append(("Update Set", test_update_set()))
        results.append(("Pause Workout", test_pause_workout()))
        results.append(("Resume Workout", test_resume_workout()))
        results.append(("Update Exercise", test_update_exercise()))
        results.append(("Delete Set", test_delete_set()))
        results.append(("Delete Exercise", test_delete_exercise()))
        results.append(("Complete Workout", test_complete_workout()))
        results.append(("Start from Template", test_start_from_template()))
        results.append(("Prevent Multiple Active", test_prevent_multiple_active()))
        results.append(("Authentication Required", test_authentication_required()))
    finally:
        cleanup()
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"\nTotal Tests: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {total - passed}{Colors.END}")
    print(f"Success Rate: {percentage:.1f}%")
    
    if passed == total:
        print(f"\n{Colors.GREEN}🎉 ALL TESTS PASSED! 🎉{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}Some tests failed. Review output above for details.{Colors.END}")
        print("\nFailed tests:")
        for name, result in results:
            if not result:
                print(f"  {Colors.RED}✗{Colors.END} {name}")

if __name__ == "__main__":
    main()
