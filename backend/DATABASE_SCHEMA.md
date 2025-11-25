# Workout Logging Database Schema

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email           │
│ password        │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────┐
│      WorkoutSession          │
├──────────────────────────────┤
│ id (PK)                      │
│ user_id (FK → User)          │
│ template_id (FK → Template)  │◄───── Optional link to template
│ status (ENUM)                │       (if workout started from one)
│ start_time                   │
│ end_time                     │
│ duration_seconds             │
│ name                         │
│ notes                        │
│ total_volume (computed)      │
│ total_sets (computed)        │
│ total_reps (computed)        │
│ created_at                   │
│ updated_at                   │
└────────┬─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────┐
│     WorkoutExercise          │
├──────────────────────────────┤
│ id (PK)                      │
│ workout_session_id (FK)      │
│ exercise_id (FK → Exercise)  │◄───── Links to Exercise catalog
│ position                     │       (global + user exercises)
│ notes                        │
└────────┬─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────┐
│        WorkoutSet            │
├──────────────────────────────┤
│ id (PK)                      │
│ workout_exercise_id (FK)     │
│ set_number                   │
│ weight (optional)            │
│ reps (optional)              │
│ duration_seconds (optional)  │
│ distance (optional)          │
│ rpe (optional)               │
│ notes (optional)             │
│ is_warmup                    │
│ is_dropset                   │
│ is_failure                   │
└──────────────────────────────┘
```

---

## Table Details

### WorkoutSession

**Primary Entity** - Represents a single workout session

| Column           | Type         | Description                | Analytics Use                       |
| ---------------- | ------------ | -------------------------- | ----------------------------------- |
| status           | ENUM         | active/completed/cancelled | Filter completed workouts for stats |
| start_time       | DateTime(TZ) | When workout began         | Streak tracking, workout frequency  |
| end_time         | DateTime(TZ) | When workout finished      | Duration calculation                |
| duration_seconds | Integer      | Computed on finish         | Workout length trends               |
| total_volume     | Float        | Sum(weight × reps)         | Volume progression graphs           |
| total_sets       | Integer      | Count of valid sets        | Workout intensity tracking          |
| total_reps       | Integer      | Sum of all reps            | Rep volume trends                   |

**Indexes:**

- `user_id` - Fast user workout queries
- `template_id` - Template usage tracking
- `status` - Filter by workout status

---

### WorkoutExercise

**Junction Entity** - Exercise instance within a workout

| Column   | Type    | Description        | Usage                     |
| -------- | ------- | ------------------ | ------------------------- |
| position | Integer | Order in workout   | Display order, reordering |
| notes    | Text    | Per-exercise notes | Form cues, observations   |

**Relationships:**

- Belongs to: `WorkoutSession` (CASCADE DELETE)
- References: `Exercise` (catalog entry)
- Has many: `WorkoutSet` (CASCADE DELETE)

---

### WorkoutSet

**Detail Entity** - Individual set data

**Strength Training:**

- `weight` + `reps` → Volume calculation
- `rpe` → Intensity tracking

**Cardio:**

- `duration_seconds` + `distance` → Pace calculation

**Bodyweight:**

- `reps` only

**Time-based:**

- `duration_seconds` only

**Set Types:**

- `is_warmup` - Exclude from PR calculations
- `is_dropset` - Special set type indicator
- `is_failure` - Taken to muscular failure

---

## Cascade Behavior

```
User (DELETE)
    ↓ CASCADE
WorkoutSession (DELETE)
    ↓ CASCADE
WorkoutExercise (DELETE)
    ↓ CASCADE
WorkoutSet (DELETE)
```

**When you delete:**

- A user → All their workouts + exercises + sets deleted
- A workout → All exercises + sets deleted
- An exercise (from workout) → All its sets deleted
- A set → Only that set deleted

---

## Analytics Query Examples

### 1. Total Volume per Exercise Over Time

```sql
SELECT
    e.name,
    ws.start_time::date as workout_date,
    SUM(wset.weight * wset.reps) as daily_volume
FROM workout_sessions ws
JOIN workout_exercises we ON we.workout_session_id = ws.id
JOIN exercises e ON e.id = we.exercise_id
JOIN workout_sets wset ON wset.workout_exercise_id = we.id
WHERE ws.user_id = ?
  AND ws.status = 'completed'
  AND e.id = ?
GROUP BY e.name, workout_date
ORDER BY workout_date DESC;
```

### 2. Personal Records (Max Weight per Exercise)

```sql
SELECT
    e.name,
    MAX(wset.weight) as max_weight,
    ws.start_time as achieved_date
FROM workout_sessions ws
JOIN workout_exercises we ON we.workout_session_id = ws.id
JOIN exercises e ON e.id = we.exercise_id
JOIN workout_sets wset ON wset.workout_exercise_id = we.id
WHERE ws.user_id = ?
  AND ws.status = 'completed'
  AND wset.is_warmup = false
GROUP BY e.id, e.name, ws.id
ORDER BY max_weight DESC;
```

### 3. Workout Streak

```sql
SELECT
    start_time::date as workout_date,
    COUNT(*) as workouts_that_day
FROM workout_sessions
WHERE user_id = ?
  AND status = 'completed'
GROUP BY workout_date
ORDER BY workout_date DESC;
```

### 4. Volume Progression (Last 30 Days)

```sql
SELECT
    start_time::date as date,
    SUM(total_volume) as total_volume,
    SUM(total_sets) as total_sets,
    SUM(total_reps) as total_reps
FROM workout_sessions
WHERE user_id = ?
  AND status = 'completed'
  AND start_time >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;
```

### 5. Most Used Exercises

```sql
SELECT
    e.name,
    COUNT(DISTINCT ws.id) as times_used,
    SUM(wset.weight * wset.reps) as total_volume
FROM workout_sessions ws
JOIN workout_exercises we ON we.workout_session_id = ws.id
JOIN exercises e ON e.id = we.exercise_id
JOIN workout_sets wset ON wset.workout_exercise_id = we.id
WHERE ws.user_id = ?
  AND ws.status = 'completed'
GROUP BY e.id, e.name
ORDER BY times_used DESC
LIMIT 10;
```

---

## Data Validation Rules

### On Set Creation

- ✅ All fields optional (except set_number)
- ✅ No validation errors for empty fields
- ✅ Sets saved as-is during active workout

### On Workout Finish

**Invalid sets are discarded if:**

- No weight AND no reps
- No duration_seconds
- No distance

**Valid set examples:**

```python
# Strength - Valid
{ weight: 100, reps: 10 }

# Cardio - Valid
{ duration_seconds: 600, distance: 5.0 }

# Bodyweight - Valid
{ reps: 20 }

# Time-based - Valid
{ duration_seconds: 60 }

# Invalid - Discarded
{ set_number: 1 }  # Nothing logged
{ weight: 100 }     # Needs reps too
```

---

## Indexes for Performance

### Recommended Indexes

```sql
-- User workouts lookup
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);

-- Filter by status
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);

-- Date range queries
CREATE INDEX idx_workout_sessions_start_time ON workout_sessions(start_time);

-- Exercise lookup in workouts
CREATE INDEX idx_workout_exercises_session_id ON workout_exercises(workout_session_id);

-- Set lookup for exercises
CREATE INDEX idx_workout_sets_exercise_id ON workout_sets(workout_exercise_id);

-- Composite index for analytics
CREATE INDEX idx_workouts_user_status_date
ON workout_sessions(user_id, status, start_time DESC);
```

---

## Storage Considerations

### Estimated Storage per Workout

```
WorkoutSession:     ~150 bytes
WorkoutExercise:    ~100 bytes × avg 5 exercises = 500 bytes
WorkoutSet:         ~150 bytes × avg 15 sets = 2,250 bytes
----------------------------------------
Total per workout:  ~2,900 bytes (~3 KB)
```

### Yearly Estimate (3 workouts/week)

```
156 workouts/year × 3 KB = ~468 KB/year/user
```

Very efficient! Even with 10,000 users working out 3×/week:

- 1 year: ~4.5 GB
- 5 years: ~22.5 GB

---

## Export-Friendly Schema

All data ready for export to:

### CSV Format

```csv
date,exercise,set,weight,reps,volume,rpe
2025-11-17,Bench Press,1,225,5,1125,8
2025-11-17,Bench Press,2,225,5,1125,8
...
```

### PDF Reports

- Workout summaries
- Progress graphs
- PR tracking

### Third-party Apps

- Standard relational format
- No proprietary encoding
- Easy JSON serialization
