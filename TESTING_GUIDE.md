# Quick Testing Guide - Live Workout Module

## Prerequisites

1. **Database must be up-to-date:**

   ```bash
   cd backend
   python -m alembic upgrade head
   ```

2. **Backend server must be running:**

   ```bash
   cd backend
   uvicorn main:app --reload
   ```

3. **Test user must exist in database**

## Running the Test Suite

```bash
cd backend
python test_live_workout.py
```

Update the test credentials in `test_live_workout.py`:

```python
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"
```

## Manual API Testing with cURL

### 1. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

Save the `access_token` from response.

### 2. Start Empty Workout

```bash
curl -X POST http://localhost:8000/api/live-workout/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workout_name":"My Workout"}'
```

### 3. Get Active Workout

```bash
curl -X GET http://localhost:8000/api/live-workout/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Add Exercise to Workout

```bash
curl -X POST http://localhost:8000/api/live-workout/1/exercises \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exercise_id":1,"position":0}'
```

### 5. Add Set to Exercise

```bash
curl -X POST http://localhost:8000/api/live-workout/exercises/1/sets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reps":"10","weight":"100","rpe":8,"completed":false}'
```

### 6. Update Set

```bash
curl -X PUT http://localhost:8000/api/live-workout/sets/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reps":"12","weight":"110","rpe":9,"completed":true}'
```

### 7. Finish Workout

```bash
curl -X POST http://localhost:8000/api/live-workout/1/finish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Start Workout from Template

First, get your template ID:

```bash
curl -X GET http://localhost:8000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Then start workout:

```bash
curl -X POST http://localhost:8000/api/live-workout/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template_id":1,"workout_name":"Template Workout"}'
```

## Common Test Scenarios

### Scenario 1: Empty Workout Flow

1. Start empty workout
2. Add exercises manually
3. Add sets to each exercise
4. Update sets as you complete them
5. Finish workout

### Scenario 2: Template-Based Workout

1. Create a template with exercises and target sets
2. Start workout from template
3. Sets are pre-populated from template
4. Update set values during workout
5. Finish workout

### Scenario 3: Workout Management

1. Start workout
2. Pause/unpause by updating `is_paused`
3. Add/remove exercises dynamically
4. Reorder exercises
5. Cancel workout (instead of finishing)

## Expected Behaviors

✅ **Should Work:**

- Starting workout from own template
- Only one active workout per user
- All endpoints require authentication
- Can add/remove exercises and sets
- Can update workout metadata
- Can finish or cancel workout

❌ **Should Fail:**

- Starting workout from another user's template (403)
- Starting second workout while one is active (400)
- Accessing workout without authentication (401)
- Modifying another user's workout (403/404)
- Updating/adding to finished workout (400)

## Debugging Tips

1. **Check backend logs** for detailed error messages
2. **Verify database state** after each operation:

   ```sql
   SELECT * FROM workout_sessions WHERE user_id = YOUR_USER_ID;
   SELECT * FROM workout_exercises WHERE workout_session_id = YOUR_WORKOUT_ID;
   SELECT * FROM workout_sets WHERE workout_exercise_id = YOUR_EXERCISE_ID;
   ```

3. **Use API documentation**: Visit `http://localhost:8000/docs` for interactive API testing

4. **Check migration status**:
   ```bash
   cd backend
   python -m alembic current
   python -m alembic history
   ```

## Frontend Testing

1. Start backend and frontend servers
2. Login to the app
3. Navigate to workout page
4. Start a workout (empty or from template)
5. Add exercises and sets
6. Complete the workout
7. Verify data persists across page refreshes

## Integration Checklist

- [ ] Backend server starts without errors
- [ ] Migration applied successfully
- [ ] All API endpoints accessible
- [ ] Authentication works correctly
- [ ] Can start empty workout
- [ ] Can start workout from template
- [ ] Can add/remove exercises
- [ ] Can add/update/remove sets
- [ ] Can finish workout
- [ ] Can cancel workout
- [ ] Template access restrictions work
- [ ] Frontend context syncs with backend
- [ ] No TypeScript errors in frontend
