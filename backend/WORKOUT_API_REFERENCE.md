# Workout Logging API - Quick Reference

## Base URL

`http://localhost:8000/api/workouts`

## Authentication

All endpoints require JWT authentication:

```
Authorization: Bearer {your_jwt_token}
```

---

## 🎯 Quick Start Flow

### 1. Start a Workout

```http
POST /api/workouts/start
Content-Type: application/json

{
  "template_id": 1,          // Optional: load from YOUR OWN template only
  "name": "Chest Day",       // Optional: workout name
  "notes": "Feeling strong!" // Optional: notes
}
```

**Important:** You can only use templates that YOU created. Cannot use other users' templates.

**Response**: Full workout session with status "active"

---

### 2. Add Exercise to Workout

```http
POST /api/workouts/{session_id}/exercises
Content-Type: application/json

{
  "exercise_id": 5,
  "position": 1,
  "notes": "Focus on form"
}
```

---

### 3. Log a Set

```http
POST /api/workouts/exercises/{workout_exercise_id}/sets
Content-Type: application/json

{
  "set_number": 1,
  "weight": 100,          // Optional
  "reps": 10,             // Optional
  "rpe": 8,               // Optional (1-10)
  "notes": "Good set",    // Optional
  "is_warmup": false      // Optional
}
```

**All fields except `set_number` are optional!**

---

### 4. Update a Set

```http
PUT /api/workouts/sets/{set_id}
Content-Type: application/json

{
  "weight": 105,
  "reps": 8,
  "rpe": 9
}
```

---

### 5. Finish Workout

```http
POST /api/workouts/{session_id}/finish
```

**Response includes:**

- Duration
- Total volume (weight × reps)
- Total sets and reps
- Final workout summary

---

## 📚 Complete Endpoint Reference

### Session Management

#### Start Workout

```http
POST /api/workouts/start
Body: { template_id?, name?, notes? }
```

#### Get Active Workout

```http
GET /api/workouts/active
```

#### Get All Workouts

```http
GET /api/workouts?status=completed
Query Params: status (optional): active|completed|cancelled
```

#### Get Workout by ID

```http
GET /api/workouts/{session_id}
```

#### Update Workout Metadata

```http
PUT /api/workouts/{session_id}
Body: { name?, notes? }
```

#### Finish Workout

```http
POST /api/workouts/{session_id}/finish
```

#### Cancel Workout

```http
POST /api/workouts/{session_id}/cancel
```

#### Delete Workout

```http
DELETE /api/workouts/{session_id}
```

---

### Exercise Management

#### Add Exercise

```http
POST /api/workouts/{session_id}/exercises
Body: { exercise_id, position?, notes? }
```

#### Update Exercise

```http
PUT /api/workouts/exercises/{workout_exercise_id}
Body: { position?, notes? }
```

#### Remove Exercise

```http
DELETE /api/workouts/exercises/{workout_exercise_id}
```

#### Reorder Exercises

```http
POST /api/workouts/{session_id}/exercises/reorder
Body: {
  "exercise_positions": [
    { "workout_exercise_id": 1, "position": 1 },
    { "workout_exercise_id": 2, "position": 2 }
  ]
}
```

---

### Set Management

#### Add Set

```http
POST /api/workouts/exercises/{workout_exercise_id}/sets
Body: {
  set_number: int,           // Required
  weight?: float,
  reps?: int,
  duration_seconds?: int,
  distance?: float,
  rpe?: int (1-10),
  notes?: string,
  is_warmup?: bool,
  is_dropset?: bool,
  is_failure?: bool
}
```

#### Update Set

```http
PUT /api/workouts/sets/{set_id}
Body: { same fields as Add Set, all optional }
```

#### Delete Set

```http
DELETE /api/workouts/sets/{set_id}
```

---

## 🔒 Security

**All endpoints enforce:**

1. Valid JWT token required
2. User can only access their own workouts
3. Cannot modify completed/cancelled workouts
4. Template access verified (owner or public)

**Error Responses:**

- `401 Unauthorized`: Missing/invalid JWT token
- `403 Forbidden`: Not your workout
- `404 Not Found`: Resource doesn't exist
- `400 Bad Request`: Invalid data or operation

---

## 📊 Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-11-17T10:30:00Z"
}
```

---

## 💡 Pro Tips

### Empty Fields Are OK!

Don't worry about logging everything immediately:

```json
// This is valid - log what you have
{
  "set_number": 1,
  "reps": 10
  // weight, RPE, notes all optional
}
```

### Invalid Sets Auto-Removed

When you finish a workout, sets with NO useful data are automatically discarded:

- Invalid: `{ set_number: 1 }` (nothing logged)
- Valid: `{ set_number: 1, reps: 10 }` (at least reps)
- Valid: `{ set_number: 1, weight: 100 }` (needs reps too)
- Valid: `{ set_number: 1, weight: 100, reps: 10 }` (perfect!)

### Flexible Exercise Types

The same schema supports:

- **Strength**: weight + reps
- **Cardio**: distance + duration_seconds
- **Bodyweight**: reps only
- **Time-based**: duration_seconds only

---

## 🧪 Testing with curl

### Get Active Workout

```bash
curl -X GET http://localhost:8000/api/workouts/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Start Workout from Template

```bash
curl -X POST http://localhost:8000/api/workouts/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template_id": 1, "name": "Leg Day"}'
```

### Add a Set

```bash
curl -X POST http://localhost:8000/api/workouts/exercises/5/sets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"set_number": 1, "weight": 225, "reps": 5, "rpe": 8}'
```

### Finish Workout

```bash
curl -X POST http://localhost:8000/api/workouts/1/finish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Postman Collection

Import the OpenAPI schema from:

```
http://localhost:8000/openapi.json
```

This will auto-generate a complete Postman collection with all endpoints!

---

## 🐛 Common Issues

### "Workout session not found"

- Check session_id is correct
- Ensure workout belongs to authenticated user

### "Cannot modify a completed workout"

- Workout is already finished
- Start a new workout instead

### "Exercise not found"

- exercise_id doesn't exist in database
- Create the exercise first via `/api/exercises`

### "Set is discarded on finish"

- Set had no weight, reps, duration, or distance
- This is expected behavior for empty sets

---

## 📖 Interactive Documentation

Visit: **http://localhost:8000/docs**

- Try all endpoints
- See request/response schemas
- Test authentication
- View example payloads
