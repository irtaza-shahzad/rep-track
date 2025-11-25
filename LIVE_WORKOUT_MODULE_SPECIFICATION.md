# Live Workout Logging Module - Complete Specification

## Executive Summary

This document describes a **real-time, persistent workout tracking system** where users can log exercises, sets, reps, and weights during their workout session. The system maintains state across navigation, supports templates, and automatically calculates analytics upon completion.

---

## Core Features Overview

### 1. **Workout Session Management**

- **Start Modes**:
  - **Empty Draft**: User starts with zero exercises and adds them during workout
  - **From Template**: User selects pre-configured template with predefined exercises
- **Session Persistence**:
  - Active workout state persists across page navigation
  - User can leave workout page (go to history, stats, settings, etc.) and return seamlessly
  - All progress preserved in browser storage until explicitly finished or cancelled
- **Multi-User Support**:
  - Each user has independent workout sessions
  - Sessions are user-scoped (cannot access other users' active workouts)

---

## Detailed Functional Requirements

### 2. **Real-Time Timer System**

#### **Workout Duration Timer**

- **Auto-Start**: Begins counting when workout starts (from template or empty draft)
- **Format**: Displays as `MM:SS` (under 1 hour) or `H:MM:SS` (over 1 hour)
- **Pause/Resume**:
  - User can pause timer (freezes workout duration)
  - Resume continues from where paused
  - Timer state persists across navigation
- **Persistence**: `elapsedSeconds` stored and restored when user navigates away/back

#### **Rest Timer** (Optional Feature)

- **Auto-Trigger**: Starts countdown after completing a set (non-warmup sets only)
- **Default Duration**: 90 seconds (configurable)
- **Visual Indicator**: Shows countdown during rest period
- **Reset**: Each completed set restarts rest timer

**Database Fields**:

```sql
workout_sessions:
  - start_time: TIMESTAMP
  - end_time: TIMESTAMP (null while active)
  - duration_seconds: INT (calculated on finish)
  - is_paused: BOOLEAN (optional for pause state)
```

---

### 3. **Exercise Management**

#### **Adding Exercises to Active Workout**

- **During Workout**: User can add exercises at any point
- **Exercise Selection**:
  - From categorized library (Chest, Back, Legs, Shoulders, Arms, Core, Cardio)
  - Quick-add from popular exercises list
  - Search/filter by muscle group, category, difficulty
- **Exercise Data**:
  - ID (database reference)
  - Name (e.g., "Barbell Bench Press")
  - Position/Order in workout (for reordering)

#### **Removing Exercises**

- User can delete exercises from active workout
- Cascading deletion: removes all associated sets
- Confirmation dialog recommended

**Database Schema**:

```sql
workout_exercises:
  - id: INT PRIMARY KEY
  - workout_session_id: INT FOREIGN KEY
  - exercise_id: INT FOREIGN KEY (references exercises table)
  - position: INT (for ordering)
  - notes: TEXT (optional)
  - created_at: TIMESTAMP
```

---

### 4. **Set Logging System**

#### **Set Structure**

Each set contains:

- **Reps (Repetitions)**: Number of repetitions performed (required to complete)
- **Weight**: Load used in lbs/kg (required to complete)
- **RPE (Rate of Perceived Exertion)**: 1-10 scale (optional, prompted after set completion)
- **Completed Status**: Boolean flag marking if set is done
- **Set Type Modifiers**:
  - **Warmup Set**: Doesn't count toward volume, skips rest timer
  - **Dropset**: Weight reduction within same set
  - **Failure**: Taken to muscular failure

#### **Set Operations**

**Adding Sets**:

- User clicks "+" to add new set to exercise
- New set starts with empty reps/weight
- Unlimited sets per exercise

**Editing Sets**:

- Real-time input for reps and weight
- Changes saved instantly to workout state
- Can edit before marking as completed

**Completing Sets**:

```
1. User enters reps + weight
2. User clicks checkmark to complete set
3. System validates both fields are filled
4. Set marked as completed (cannot edit after)
5. RPE modal opens for optional rating
6. Rest timer starts (if not warmup)
7. Set data persisted
```

**Deleting Sets**:

- User can remove incomplete or completed sets
- Confirmation recommended for completed sets

**Database Schema**:

```sql
workout_sets:
  - id: INT PRIMARY KEY
  - workout_exercise_id: INT FOREIGN KEY
  - set_number: INT (position within exercise)
  - reps: INT (required for completion)
  - weight: DECIMAL(6,2) (required for completion)
  - rpe: INT (1-10, nullable)
  - is_completed: BOOLEAN
  - is_warmup: BOOLEAN DEFAULT false
  - is_dropset: BOOLEAN DEFAULT false
  - is_to_failure: BOOLEAN DEFAULT false
  - completed_at: TIMESTAMP (when marked complete)
  - created_at: TIMESTAMP
```

---

### 5. **RPE (Rate of Perceived Exertion) System**

#### **Flow**:

1. User completes a set (clicks checkmark)
2. Modal/drawer appears with RPE slider (1-10)
3. User selects perceived difficulty:
   - **1-3**: Very Easy
   - **4-6**: Moderate
   - **7-8**: Hard
   - **9**: Very Hard (1-2 reps in reserve)
   - **10**: Maximum Effort (failure)
4. User saves RPE or skips (optional)
5. RPE stored with set data

**Purpose**: Tracks training intensity for progressive overload tracking

---

### 6. **State Persistence & Navigation**

#### **Active Workout State Storage**

The system maintains workout state in:

- **Browser LocalStorage**: `WORKOUT_DRAFT` key
- **React Context**: `WorkoutContext` for global state management

**Stored Data Structure**:

```typescript
{
  exercises: Exercise[],           // Array of exercises with sets
  elapsedSeconds: number,          // Timer value
  isPaused: boolean,               // Pause state
  workoutNumber: number,           // Incremental workout count
  workoutName: string,             // User-editable workout name
  startTime: number                // Unix timestamp when started
}
```

#### **Cross-Navigation Persistence**

- **Leaving Workout Page**:
  - State automatically saved to storage
  - Timer continues if not paused
  - All exercise/set data preserved
- **Returning to Workout Page**:

  - State restored from storage
  - Timer resumes from `elapsedSeconds`
  - All exercises/sets displayed as left

- **App Reload**:
  - Workout state persists through browser refresh
  - User can resume workout after closing/reopening app

**Implementation Notes**:

- Use React `useEffect` to sync state to storage on every change
- Load state on component mount
- Clear storage only when workout explicitly finished/cancelled

---

### 7. **Finishing Workout**

#### **Completion Flow**:

```
1. User clicks "Finish Workout" button
2. System validates at least one exercise with completed sets exists
3. Calculations triggered:
   - Total Duration (elapsed seconds)
   - Total Volume (sum of all reps × weight across all sets)
   - Total Sets (count of completed sets)
   - Total Reps (sum of all reps)
   - Exercises Count
4. Workout data package created
5. POST request to backend: /api/workouts/{session_id}/finish
6. Backend processes:
   - Marks session as COMPLETED
   - Discards invalid/incomplete sets
   - Calculates analytics
   - Updates user statistics
   - Triggers streak calculation
   - Stores final workout record
7. Frontend receives confirmation
8. Active workout cleared from storage
9. Success modal displayed with summary
10. User redirected to dashboard
```

#### **Data Sent to Backend**:

```json
{
  "workout_session_id": 123,
  "end_time": "2025-11-25T15:30:00Z",
  "duration_seconds": 2700,
  "name": "Push Day - Chest & Triceps",
  "notes": "Felt strong today",
  "exercises": [
    {
      "exercise_id": 1,
      "position": 1,
      "sets": [
        {
          "set_number": 1,
          "reps": 10,
          "weight": 135,
          "rpe": 7,
          "is_completed": true,
          "is_warmup": false
        },
        {
          "set_number": 2,
          "reps": 8,
          "weight": 145,
          "rpe": 8,
          "is_completed": true
        }
      ]
    }
  ]
}
```

---

### 8. **Analytics & Calculations**

#### **Calculated Upon Finish**:

**Total Volume**:

```
Formula: Σ (reps × weight) for all completed sets
Example:
  Set 1: 10 reps × 135 lbs = 1,350 lbs
  Set 2: 8 reps × 145 lbs = 1,160 lbs
  Total Volume = 2,510 lbs
```

**Total Sets**: Count of all completed sets (excluding warmups optionally)

**Total Reps**: Sum of reps across all completed sets

**Duration**: Time from start to finish (accounting for pauses)

**Exercises Count**: Number of unique exercises performed

#### **Post-Workout Calculations** (Backend):

**Streak System**:

- Check last workout date
- If consecutive days → increment streak
- If gap > 1 day → reset streak to 1
- Update longest streak if current exceeds it
- Track weekly workout frequency

**Personal Records (PRs)**:

- Check if any set exceeds previous max for that exercise
- Store: exercise_id, weight, reps, date achieved
- Trigger notification if PR broken

**Progress Tracking**:

- Volume trends (weekly/monthly averages)
- Frequency (workouts per week)
- Muscle group distribution
- Workout duration trends

---

### 9. **Cancellation Flow**

- User clicks "Cancel Workout"
- Confirmation dialog: "All progress will be lost"
- If confirmed:
  - Active workout deleted from storage
  - No data saved to backend
  - Workout session marked as CANCELLED (optional)
  - User returned to dashboard

**Database Handling**:

```sql
-- Option 1: Soft delete (preserve data for analytics)
UPDATE workout_sessions
SET status = 'CANCELLED'
WHERE id = ?;

-- Option 2: Hard delete (remove completely)
DELETE FROM workout_sessions WHERE id = ?;
```

---

## Database Schema Requirements

### **workout_sessions** (Main Table)

```sql
CREATE TABLE workout_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    template_id INT NULL,                    -- If started from template
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',

    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration_seconds INT NULL,               -- Calculated on finish

    name VARCHAR(255) DEFAULT 'Workout',
    notes TEXT NULL,

    -- Calculated analytics
    total_volume DECIMAL(10,2) NULL,         -- Sum(reps × weight)
    total_sets INT NULL,
    total_reps INT NULL,
    exercises_count INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_date (user_id, start_time)
);
```

### **workout_exercises** (Junction Table)

```sql
CREATE TABLE workout_exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workout_session_id INT NOT NULL,
    exercise_id INT NOT NULL,                -- Reference to exercises library

    position INT NOT NULL,                   -- Order in workout (1, 2, 3...)
    notes TEXT NULL,                         -- Exercise-specific notes

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT,
    INDEX idx_session (workout_session_id),
    UNIQUE KEY unique_position (workout_session_id, position)
);
```

### **workout_sets** (Set Logging Table)

```sql
CREATE TABLE workout_sets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workout_exercise_id INT NOT NULL,

    set_number INT NOT NULL,                 -- 1, 2, 3... within exercise
    reps INT NOT NULL,
    weight DECIMAL(6,2) NOT NULL,
    rpe INT NULL CHECK (rpe BETWEEN 1 AND 10),

    is_completed BOOLEAN DEFAULT false,
    is_warmup BOOLEAN DEFAULT false,
    is_dropset BOOLEAN DEFAULT false,
    is_to_failure BOOLEAN DEFAULT false,

    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE,
    INDEX idx_exercise (workout_exercise_id)
);
```

### **exercises** (Exercise Library)

```sql
CREATE TABLE exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category ENUM('Strength', 'Cardio', 'Flexibility', 'Plyometric'),
    muscle_group ENUM('Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'),
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced'),
    instructions TEXT NULL,
    is_system BOOLEAN DEFAULT true,          -- System vs user-created
    user_id INT NULL,                        -- If user-created

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_muscle_group (muscle_group)
);
```

---

## API Endpoints Required

### **Session Management**

```
POST   /api/workouts/start
  Body: { template_id?: int, name?: string }
  Returns: { session_id, start_time, status }

GET    /api/workouts/active
  Returns: Active workout session with all exercises/sets or null

PUT    /api/workouts/{session_id}
  Body: { name?: string, notes?: string }
  Returns: Updated session

POST   /api/workouts/{session_id}/finish
  Returns: { duration, total_volume, total_sets, streak_updated, prs_broken }

POST   /api/workouts/{session_id}/cancel
  Returns: { success: true }
```

### **Exercise Management**

```
POST   /api/workouts/{session_id}/exercises
  Body: { exercise_id: int, position?: int }
  Returns: workout_exercise with id

DELETE /api/workouts/exercises/{workout_exercise_id}
  Returns: { success: true }

POST   /api/workouts/{session_id}/exercises/reorder
  Body: { exercise_positions: [{id: int, position: int}] }
  Returns: Updated workout
```

### **Set Management**

```
POST   /api/workouts/exercises/{workout_exercise_id}/sets
  Body: { reps: int, weight: float, rpe?: int, is_warmup?: bool }
  Returns: workout_set with id

PUT    /api/workouts/sets/{set_id}
  Body: { reps?: int, weight?: float, rpe?: int, is_completed?: bool }
  Returns: Updated set

DELETE /api/workouts/sets/{set_id}
  Returns: { success: true }
```

---

## Business Rules & Validation

### **Starting Workout**

- ✅ User can have only ONE active workout at a time
- ✅ Starting new workout with active one existing → ERROR or force-finish previous
- ✅ Template exercises copied to workout (not referenced)

### **Logging Sets**

- ❌ Cannot complete set without reps AND weight
- ✅ Can save incomplete sets (but won't count toward totals)
- ✅ RPE is always optional
- ✅ Warmup sets excluded from volume calculations (optional rule)

### **Finishing Workout**

- ❌ Cannot finish workout with zero completed sets
- ✅ Incomplete sets automatically discarded
- ✅ Duration must be > 0 seconds
- ✅ Analytics recalculated on every finish

### **Streak Rules**

- ✅ Workout today + workout yesterday = streak continues
- ❌ Gap > 1 day = streak resets to 1
- ✅ Multiple workouts same day = count as 1 for streak
- ✅ Longest streak tracks historical maximum

---

## Frontend State Management

### **WorkoutContext (React Context API)**

Provides global state for active workout:

```typescript
interface WorkoutContext {
  activeWorkout: WorkoutState | null;
  startWorkout: (exercises?: Exercise[]) => void;
  updateWorkout: (workout: WorkoutState) => void;
  endWorkout: () => void;
  hasActiveWorkout: () => boolean;
}
```

### **LocalStorage Persistence**

- **Key**: `WORKOUT_DRAFT` or `activeWorkout`
- **Format**: JSON stringified WorkoutState
- **Update Trigger**: Every state change (useEffect dependency)
- **Load Trigger**: Component mount
- **Clear Trigger**: Workout finished or cancelled

---

## User Experience Flow

### **Scenario 1: Starting Empty Workout**

```
1. User clicks "Start Workout" on Dashboard
2. System creates new workout session (POST /api/workouts/start)
3. Timer starts at 0:00
4. Empty workout screen with "Add Exercise" button
5. User selects exercise from library
6. Exercise added with 1 empty set
7. User enters reps (10) and weight (135)
8. User clicks checkmark → set completed
9. RPE modal appears, user selects 7
10. Rest timer starts (90s countdown)
11. User adds another set → repeat 7-10
12. User adds another exercise → repeat 5-11
13. User clicks "Finish Workout"
14. Summary shows duration, volume, congratulations
15. User returns to dashboard
```

### **Scenario 2: Using Template**

```
1. User selects "Push Day" template from Dashboard
2. System loads template exercises (Bench Press, OHP, Dips)
3. Timer starts at 0:00
4. All exercises pre-populated with 1 empty set each
5. User logs sets for each exercise (same as scenario 1)
6. User can add/remove exercises during workout
7. User finishes → template not modified, new workout saved
```

### **Scenario 3: Navigation During Workout**

```
1. User starts workout, logs 2 exercises
2. User navigates to History page (timer still running)
3. Workout state saved to localStorage
4. User views past workouts
5. User clicks "Resume Workout" (button appears in header)
6. Returns to workout page with all data intact
7. Timer shows accumulated time
8. User continues logging sets
```

---

## Technical Implementation Notes

### **Frontend Technologies**

- **React 18+** with TypeScript
- **React Context API** for state management
- **React Router** for navigation
- **LocalStorage API** for persistence
- **Axios** for HTTP requests
- **shadcn/ui** for UI components

### **Key Frontend Files**

```
src/pages/Workout.tsx              -- Main workout logging UI
src/contexts/WorkoutContext.tsx    -- Global workout state
src/lib/workoutStorage.ts          -- LocalStorage utilities
src/services/workoutService.ts     -- API calls
```

### **Backend Technologies**

- **FastAPI** (Python)
- **SQLAlchemy** ORM
- **PostgreSQL/MySQL** database
- **JWT** authentication
- **Alembic** migrations

### **Key Backend Files**

```
app/api/routers/workout_router.py     -- Workout endpoints
app/api/services/workout_service.py   -- Business logic
app/models/workout_model.py           -- SQLAlchemy models
```

---

## Success Metrics

### **Functional Requirements Met**:

- ✅ User can start workout (empty or from template)
- ✅ User can add/remove exercises during workout
- ✅ User can log sets with reps, weight, RPE
- ✅ User can navigate away and return without data loss
- ✅ Timer persists across navigation
- ✅ Workout completes with analytics calculated
- ✅ Data saved to backend and cleared from local storage
- ✅ Streak system updates post-workout
- ✅ Multiple users can have independent sessions

### **Non-Functional Requirements**:

- ⚡ Fast: State updates in < 100ms
- 💾 Reliable: No data loss on navigation/refresh
- 🔒 Secure: User can only access their own workouts
- 📱 Responsive: Works on mobile, tablet, desktop
- ♿ Accessible: Keyboard navigation, screen reader support

---

## Testing Checklist

### **Unit Tests**

- [ ] Start workout (empty and from template)
- [ ] Add/remove exercises
- [ ] Add/remove sets
- [ ] Complete set with/without RPE
- [ ] Timer starts/pauses/resumes
- [ ] Volume calculation accuracy
- [ ] State persistence to localStorage
- [ ] State restoration from localStorage

### **Integration Tests**

- [ ] Full workout flow: start → add exercises → log sets → finish
- [ ] Navigation during active workout
- [ ] Multiple browser tabs (should sync or prevent)
- [ ] Concurrent users don't interfere

### **Edge Cases**

- [ ] Finish workout with zero sets → should fail
- [ ] Complete set without reps/weight → should warn
- [ ] Start workout with existing active → should warn/prevent
- [ ] Browser refresh mid-workout → should restore
- [ ] Logout during workout → should save draft or warn

---

## Summary for Backend Implementation

**What Backend Needs to Implement:**

1. **Database Tables**: workout_sessions, workout_exercises, workout_sets, exercises
2. **API Endpoints**: Start, update, finish, cancel workouts; add/remove exercises; add/update/delete sets
3. **Business Logic**:
   - Only one active workout per user
   - Validate set completion (reps + weight required)
   - Calculate analytics on finish (volume, duration, totals)
   - Discard incomplete sets on finish
   - Update streak system post-workout
   - Track personal records
4. **Security**: User can only access/modify their own workouts
5. **Performance**: Handle real-time updates efficiently
6. **Data Integrity**: Cascading deletes, foreign key constraints

**Data Flow**:

```
Frontend → POST /start → Backend creates session → Returns session_id
Frontend → POST /exercises → Backend adds to session
Frontend → POST /sets → Backend logs set
Frontend → PUT /sets/{id} → Backend updates set (mark completed, add RPE)
Frontend → POST /finish → Backend calculates analytics, updates streak, saves workout → Returns summary
```

This module is the **core of the application** where users spend most time. It must be robust, performant, and reliable.
