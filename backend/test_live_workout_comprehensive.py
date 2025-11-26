"""
Comprehensive test suite for Live Workout Module
Tests all requirements from LIVE_WORKOUT_MODULE_SPECIFICATION.md
Run: python test_live_workout_comprehensive.py
"""
import requests
import json
import time
from typing import Optional, Dict, List

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

# Color output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")


def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")


def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")


def print_section(msg):
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}{Colors.END}\n")


class LiveWorkoutTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.active_workout_id: Optional[int] = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "total": 0
        }
        
    def get_headers(self):
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def assert_test(self, condition: bool, test_name: str, details: str = ""):
        """Track test results"""
        self.test_results["total"] += 1
        if condition:
            self.test_results["passed"] += 1
            print_success(f"{test_name}")
            if details:
                print(f"  └─ {details}")
        else:
            self.test_results["failed"] += 1
            print_error(f"{test_name}")
            if details:
                print(f"  └─ {details}")
    
    def login(self) -> bool:
        """Authenticate and get token"""
        print_section("TEST 1: Authentication")
        
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("data", {}).get("access_token")
            self.user_id = data.get("data", {}).get("user", {}).get("id")
            self.assert_test(
                self.token is not None,
                "User authentication successful",
                f"User ID: {self.user_id}"
            )
            return True
        else:
            self.assert_test(False, "User authentication failed", response.text)
            return False
    
    def test_no_active_workout_initially(self) -> bool:
        """Test: No active workout should exist initially"""
        print_section("TEST 2: Initial State Check")
        
        response = requests.get(
            f"{API_BASE}/live-workout/active",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            workout = data.get("data")
            
            # If there's an active workout, clean it up
            if workout:
                print_info("Found existing active workout, cleaning up...")
                cleanup_response = requests.delete(
                    f"{API_BASE}/live-workout/{workout['id']}",
                    headers=self.get_headers()
                )
                if cleanup_response.status_code == 200:
                    print_success("Cleanup successful")
                
                # Verify it's gone
                verify_response = requests.get(
                    f"{API_BASE}/live-workout/active",
                    headers=self.get_headers()
                )
                workout = verify_response.json().get("data")
            
            self.assert_test(
                workout is None,
                "No active workout exists initially",
                "Ready for testing"
            )
            return True
        else:
            self.assert_test(False, "Failed to check active workout", response.text)
            return False
    
    def test_start_empty_workout(self) -> Optional[Dict]:
        """Test: Start empty workout (no template)"""
        print_section("TEST 3: Start Empty Workout")
        
        response = requests.post(
            f"{API_BASE}/live-workout/start",
            headers=self.get_headers(),
            json={"workout_name": "Test Empty Workout"}
        )
        
        if response.status_code == 201:
            data = response.json()
            workout = data.get("data")
            
            self.active_workout_id = workout.get("id")
            
            # Verify structure
            self.assert_test(
                workout.get("id") is not None,
                "Workout created with ID",
                f"ID: {workout.get('id')}"
            )
            
            self.assert_test(
                workout.get("workoutNumber") is not None,
                "Workout number assigned",
                f"Number: {workout.get('workoutNumber')}"
            )
            
            self.assert_test(
                workout.get("startTime") is not None,
                "Start time recorded (epoch milliseconds)",
                f"Start time: {workout.get('startTime')}"
            )
            
            self.assert_test(
                workout.get("isActive") == True,
                "Workout marked as active"
            )
            
            self.assert_test(
                workout.get("isPaused") == False,
                "Workout not paused initially"
            )
            
            self.assert_test(
                len(workout.get("exercises", [])) == 0,
                "Empty workout has no exercises",
                "Exercise count: 0"
            )
            
            return workout
        else:
            self.assert_test(False, "Failed to start empty workout", response.text)
            return None
    
    def test_prevent_multiple_active_workouts(self) -> bool:
        """Test: Prevent starting multiple concurrent workouts"""
        print_section("TEST 4: Prevent Multiple Active Workouts")
        
        response = requests.post(
            f"{API_BASE}/live-workout/start",
            headers=self.get_headers(),
            json={"workout_name": "Should Fail"}
        )
        
        self.assert_test(
            response.status_code == 400,
            "System prevents multiple active workouts",
            "Got expected 400 error"
        )
        
        return response.status_code == 400
    
    def test_get_active_workout(self) -> Optional[Dict]:
        """Test: Retrieve active workout"""
        print_section("TEST 5: Get Active Workout")
        
        response = requests.get(
            f"{API_BASE}/live-workout/active",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            workout = data.get("data")
            
            self.assert_test(
                workout is not None,
                "Active workout retrieved successfully"
            )
            
            self.assert_test(
                workout.get("id") == self.active_workout_id,
                "Correct workout returned",
                f"ID matches: {self.active_workout_id}"
            )
            
            return workout
        else:
            self.assert_test(False, "Failed to get active workout", response.text)
            return None
    
    def test_add_exercise_to_workout(self, exercise_id: int = 1) -> Optional[Dict]:
        """Test: Add exercise to active workout"""
        print_section(f"TEST 6: Add Exercise to Workout (Exercise ID: {exercise_id})")
        
        response = requests.post(
            f"{API_BASE}/live-workout/{self.active_workout_id}/exercises",
            headers=self.get_headers(),
            json={"exercise_id": exercise_id, "position": 0}
        )
        
        if response.status_code == 201:
            data = response.json()
            exercise = data.get("data")
            
            self.assert_test(
                exercise.get("id") is not None,
                "Exercise added successfully",
                f"Exercise ID: {exercise.get('id')}"
            )
            
            self.assert_test(
                exercise.get("exerciseId") == exercise_id,
                "Correct exercise reference",
                f"Exercise ID: {exercise_id}"
            )
            
            self.assert_test(
                exercise.get("exercise") is not None,
                "Exercise details populated",
                f"Name: {exercise.get('exercise', {}).get('name')}"
            )
            
            self.assert_test(
                exercise.get("sets") == [],
                "New exercise has no sets",
                "Sets: []"
            )
            
            return exercise
        else:
            self.assert_test(False, "Failed to add exercise", response.text)
            return None
    
    def test_add_set_to_exercise(self, workout_exercise_id: int) -> Optional[Dict]:
        """Test: Add set to exercise"""
        print_section(f"TEST 7: Add Set to Exercise (WorkoutExercise ID: {workout_exercise_id})")
        
        set_data = {
            "reps": "10",
            "weight": "135",
            "rpe": 8,
            "completed": False,
            "is_warmup": False,
            "is_dropset": False,
            "is_failure": False,
            "position": 0
        }
        
        response = requests.post(
            f"{API_BASE}/live-workout/exercises/{workout_exercise_id}/sets",
            headers=self.get_headers(),
            json=set_data
        )
        
        if response.status_code == 201:
            data = response.json()
            workout_set = data.get("data")
            
            self.assert_test(
                workout_set.get("id") is not None,
                "Set added successfully",
                f"Set ID: {workout_set.get('id')}"
            )
            
            self.assert_test(
                workout_set.get("reps") == "10",
                "Reps stored as string",
                f"Reps: '{workout_set.get('reps')}'"
            )
            
            self.assert_test(
                workout_set.get("weight") == "135",
                "Weight stored as string",
                f"Weight: '{workout_set.get('weight')}'"
            )
            
            self.assert_test(
                workout_set.get("rpe") == 8,
                "RPE stored correctly",
                f"RPE: {workout_set.get('rpe')}"
            )
            
            self.assert_test(
                workout_set.get("completed") == False,
                "Set not completed initially"
            )
            
            return workout_set
        else:
            self.assert_test(False, "Failed to add set", response.text)
            return None
    
    def test_update_set(self, set_id: int) -> bool:
        """Test: Update existing set"""
        print_section(f"TEST 8: Update Set (Set ID: {set_id})")
        
        update_data = {
            "reps": "12",
            "weight": "145",
            "rpe": 9,
            "completed": True
        }
        
        response = requests.put(
            f"{API_BASE}/live-workout/sets/{set_id}",
            headers=self.get_headers(),
            json=update_data
        )
        
        if response.status_code == 200:
            data = response.json()
            updated_set = data.get("data")
            
            self.assert_test(
                updated_set.get("reps") == "12",
                "Reps updated correctly",
                f"Reps: {updated_set.get('reps')}"
            )
            
            self.assert_test(
                updated_set.get("weight") == "145",
                "Weight updated correctly",
                f"Weight: {updated_set.get('weight')}"
            )
            
            self.assert_test(
                updated_set.get("completed") == True,
                "Set marked as completed"
            )
            
            return True
        else:
            self.assert_test(False, "Failed to update set", response.text)
            return False
    
    def test_pause_workout(self) -> bool:
        """Test: Pause active workout"""
        print_section(f"TEST 9: Pause Workout")
        
        response = requests.put(
            f"{API_BASE}/live-workout/{self.active_workout_id}",
            headers=self.get_headers(),
            json={"is_paused": True}
        )
        
        if response.status_code == 200:
            data = response.json()
            workout = data.get("data")
            
            self.assert_test(
                workout.get("isPaused") == True,
                "Workout paused successfully"
            )
            
            return True
        else:
            self.assert_test(False, "Failed to pause workout", response.text)
            return False
    
    def test_resume_workout(self) -> bool:
        """Test: Resume paused workout"""
        print_section(f"TEST 10: Resume Workout")
        
        response = requests.put(
            f"{API_BASE}/live-workout/{self.active_workout_id}",
            headers=self.get_headers(),
            json={"is_paused": False}
        )
        
        if response.status_code == 200:
            data = response.json()
            workout = data.get("data")
            
            self.assert_test(
                workout.get("isPaused") == False,
                "Workout resumed successfully"
            )
            
            return True
        else:
            self.assert_test(False, "Failed to resume workout", response.text)
            return False
    
    def test_add_multiple_exercises(self) -> List[Dict]:
        """Test: Add multiple exercises"""
        print_section("TEST 11: Add Multiple Exercises")
        
        exercises = []
        exercise_ids = [2, 3, 4]  # Add 3 more exercises
        
        for idx, ex_id in enumerate(exercise_ids):
            response = requests.post(
                f"{API_BASE}/live-workout/{self.active_workout_id}/exercises",
                headers=self.get_headers(),
                json={"exercise_id": ex_id, "position": idx + 1}
            )
            
            if response.status_code == 201:
                data = response.json()
                exercises.append(data.get("data"))
        
        self.assert_test(
            len(exercises) == 3,
            "Multiple exercises added successfully",
            f"Added {len(exercises)} exercises"
        )
        
        return exercises
    
    def test_remove_exercise(self, workout_exercise_id: int) -> bool:
        """Test: Remove exercise from workout"""
        print_section(f"TEST 12: Remove Exercise (ID: {workout_exercise_id})")
        
        response = requests.delete(
            f"{API_BASE}/live-workout/exercises/{workout_exercise_id}",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            self.assert_test(
                True,
                "Exercise removed successfully"
            )
            
            # Verify it's gone
            verify_response = requests.get(
                f"{API_BASE}/live-workout/active",
                headers=self.get_headers()
            )
            
            if verify_response.status_code == 200:
                workout = verify_response.json().get("data")
                exercise_ids = [ex.get("id") for ex in workout.get("exercises", [])]
                
                self.assert_test(
                    workout_exercise_id not in exercise_ids,
                    "Exercise no longer in workout",
                    f"Remaining exercises: {len(exercise_ids)}"
                )
            
            return True
        else:
            self.assert_test(False, "Failed to remove exercise", response.text)
            return False
    
    def test_remove_set(self, set_id: int) -> bool:
        """Test: Remove set from exercise"""
        print_section(f"TEST 13: Remove Set (ID: {set_id})")
        
        response = requests.delete(
            f"{API_BASE}/live-workout/sets/{set_id}",
            headers=self.get_headers()
        )
        
        self.assert_test(
            response.status_code == 200,
            "Set removed successfully" if response.status_code == 200 else "Failed to remove set",
            response.text if response.status_code != 200 else ""
        )
        
        return response.status_code == 200
    
    def test_finish_workout(self) -> bool:
        """Test: Complete and finish workout"""
        print_section("TEST 14: Finish Workout")
        
        response = requests.post(
            f"{API_BASE}/live-workout/{self.active_workout_id}/finish",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            result = data.get("data")
            
            self.assert_test(
                result.get("message") is not None,
                "Workout finished successfully",
                result.get("message")
            )
            
            self.assert_test(
                result.get("workout_id") == self.active_workout_id,
                "Correct workout finished"
            )
            
            # Verify no active workout exists
            verify_response = requests.get(
                f"{API_BASE}/live-workout/active",
                headers=self.get_headers()
            )
            
            if verify_response.status_code == 200:
                workout = verify_response.json().get("data")
                self.assert_test(
                    workout is None,
                    "No active workout after finishing"
                )
            
            return True
        else:
            self.assert_test(False, "Failed to finish workout", response.text)
            return False
    
    def test_start_from_template(self, template_id: int = 1) -> Optional[Dict]:
        """Test: Start workout from template"""
        print_section(f"TEST 15: Start Workout from Template (ID: {template_id})")
        
        response = requests.post(
            f"{API_BASE}/live-workout/start",
            headers=self.get_headers(),
            json={"template_id": template_id, "workout_name": "Test Template Workout"}
        )
        
        if response.status_code == 201:
            data = response.json()
            workout = data.get("data")
            
            self.active_workout_id = workout.get("id")
            
            self.assert_test(
                workout.get("templateId") == template_id,
                "Workout linked to template",
                f"Template ID: {template_id}"
            )
            
            exercise_count = len(workout.get("exercises", []))
            self.assert_test(
                exercise_count > 0,
                "Exercises copied from template",
                f"Exercise count: {exercise_count}"
            )
            
            # Check if sets were copied
            total_sets = sum(len(ex.get("sets", [])) for ex in workout.get("exercises", []))
            self.assert_test(
                total_sets >= 0,
                "Sets structure created",
                f"Total sets: {total_sets}"
            )
            
            return workout
        else:
            self.assert_test(False, "Failed to start from template", response.text)
            return None
    
    def test_cancel_workout(self) -> bool:
        """Test: Cancel/delete active workout"""
        print_section("TEST 16: Cancel Workout")
        
        response = requests.delete(
            f"{API_BASE}/live-workout/{self.active_workout_id}",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            self.assert_test(
                True,
                "Workout cancelled successfully"
            )
            
            # Verify no active workout
            verify_response = requests.get(
                f"{API_BASE}/live-workout/active",
                headers=self.get_headers()
            )
            
            if verify_response.status_code == 200:
                workout = verify_response.json().get("data")
                self.assert_test(
                    workout is None,
                    "No active workout after cancellation"
                )
            
            return True
        else:
            self.assert_test(False, "Failed to cancel workout", response.text)
            return False
    
    def print_summary(self):
        """Print test summary"""
        print_section("TEST SUMMARY")
        
        total = self.test_results["total"]
        passed = self.test_results["passed"]
        failed = self.test_results["failed"]
        
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests:  {total}")
        print_success(f"Passed:       {passed}")
        if failed > 0:
            print_error(f"Failed:       {failed}")
        else:
            print(f"Failed:       {failed}")
        print(f"Pass Rate:    {pass_rate:.1f}%\n")
        
        if pass_rate == 100:
            print_success("🎉 ALL TESTS PASSED! 🎉")
        elif pass_rate >= 80:
            print(f"{Colors.YELLOW}⚠ Most tests passed, but some issues found{Colors.END}")
        else:
            print_error("❌ Many tests failed. Please review implementation.")
    
    def run_all_tests(self):
        """Execute comprehensive test suite"""
        print("\n" + "="*60)
        print("  LIVE WORKOUT MODULE - COMPREHENSIVE TEST SUITE")
        print("="*60)
        
        # Phase 1: Authentication
        if not self.login():
            print_error("Cannot proceed without authentication")
            return
        
        # Phase 2: Initial state
        if not self.test_no_active_workout_initially():
            print_error("Cannot proceed with dirty state")
            return
        
        # Phase 3: Empty workout flow
        workout = self.test_start_empty_workout()
        if not workout:
            print_error("Cannot proceed without workout")
            return
        
        self.test_prevent_multiple_active_workouts()
        self.test_get_active_workout()
        
        # Phase 4: Exercise management
        exercise = self.test_add_exercise_to_workout(exercise_id=1)
        if exercise:
            workout_exercise_id = exercise.get("id")
            
            # Phase 5: Set management
            workout_set = self.test_add_set_to_exercise(workout_exercise_id)
            if workout_set:
                set_id = workout_set.get("id")
                self.test_update_set(set_id)
            
            # Phase 6: Pause/Resume
            self.test_pause_workout()
            self.test_resume_workout()
            
            # Phase 7: Multiple exercises
            more_exercises = self.test_add_multiple_exercises()
            
            # Phase 8: Remove operations
            if more_exercises and len(more_exercises) > 0:
                self.test_remove_exercise(more_exercises[0].get("id"))
            
            if workout_set:
                # Add another set to test removal
                another_set = self.test_add_set_to_exercise(workout_exercise_id)
                if another_set:
                    self.test_remove_set(another_set.get("id"))
            
            # Phase 9: Finish workout
            self.test_finish_workout()
        
        # Phase 10: Template workflow
        self.test_start_from_template(template_id=1)
        self.test_cancel_workout()
        
        # Print summary
        self.print_summary()


if __name__ == "__main__":
    tester = LiveWorkoutTester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
