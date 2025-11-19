# Template Access Rules - Security Policy

## 🔒 Strict Template Ownership Rule

### Policy

**Users can ONLY use their own templates for workouts. No exceptions.**

### Implementation

```python
# app/api/services/workout/session_service.py
def _load_template_into_session(...):
    # STRICT RULE: User can ONLY use their own templates
    if template.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only start workouts from your own templates"
        )
```

---

## 📋 User Workflow Options

### Option 1: Start from YOUR Template

```http
POST /api/workouts/start
{
  "template_id": 5  // Must be a template YOU created
}
```

**Result:**

- ✅ Success if template belongs to you
- ❌ HTTP 403 if template belongs to another user

### Option 2: Start from Empty Draft

```http
POST /api/workouts/start
{
  "name": "My Custom Workout"
  // No template_id = empty workout
}
```

**Result:**

- ✅ Always succeeds
- Empty workout created
- You add exercises/sets manually during the workout

---

## 🎯 What You CAN Do

During an active workout, you have FULL control:

✅ **Add Exercises**

```http
POST /api/workouts/{session_id}/exercises
{ "exercise_id": 10 }
```

✅ **Remove Exercises**

```http
DELETE /api/workouts/exercises/{workout_exercise_id}
```

✅ **Add Sets**

```http
POST /api/workouts/exercises/{workout_exercise_id}/sets
{ "set_number": 1, "weight": 100, "reps": 10 }
```

✅ **Update Sets**

```http
PUT /api/workouts/sets/{set_id}
{ "weight": 105, "reps": 8 }
```

✅ **Delete Sets**

```http
DELETE /api/workouts/sets/{set_id}
```

✅ **Reorder Exercises**

```http
POST /api/workouts/{session_id}/exercises/reorder
```

---

## 🚫 What You CANNOT Do

❌ **Use another user's template**

```http
POST /api/workouts/start
{ "template_id": 999 }  // Template owned by user #123

Response: HTTP 403 Forbidden
{
  "detail": "You can only start workouts from your own templates"
}
```

❌ **Modify another user's workout**

```
All workout operations check:
- JWT user_id == workout_session.user_id

Response: HTTP 403 Forbidden
{
  "detail": "You don't have permission to access this workout session"
}
```

---

## 🔐 Security Layers

### Layer 1: Template Ownership Check

```python
if template.owner_id != user_id:
    raise HTTPException(403, "Can only use your own templates")
```

### Layer 2: Workout Session Ownership Check

```python
if session.user_id != user_id:
    raise HTTPException(403, "Not your workout")
```

### Layer 3: JWT Authentication

```python
@router.post("/api/workouts/start")
def start_workout(payload: dict = Depends(verify_jwt)):
    user_id = payload.get("sub")  # Extracted from JWT
```

---

## 💡 Use Cases

### Use Case 1: Training from Your Template

1. ✅ Create template "Push Day" (you are owner)
2. ✅ Start workout from "Push Day" template
3. ✅ Log sets during workout
4. ✅ Add extra exercises if needed
5. ✅ Finish workout

### Use Case 2: Custom Workout (No Template)

1. ✅ Start empty workout
2. ✅ Add "Bench Press" exercise
3. ✅ Add "Squat" exercise
4. ✅ Log sets for each
5. ✅ Remove "Squat" if you skip it
6. ✅ Finish workout

### Use Case 3: Trying to Use Someone Else's Template ❌

1. ❌ User A creates template "Advanced Program"
2. ❌ User B tries: `POST /workouts/start { template_id: A's template }`
3. ❌ Result: **HTTP 403 Forbidden**
4. ✅ User B must create their own template or start empty

---

## 📊 Comparison: Public vs Private Templates

### Old Behavior (REMOVED)

```python
# Allowed public templates
if template.owner_id != user_id and not template.is_public:
    raise HTTPException(403)
```

- Users could use public templates ❌
- Shared templates allowed ❌

### New Behavior (CURRENT)

```python
# STRICT ownership only
if template.owner_id != user_id:
    raise HTTPException(403)
```

- Users can ONLY use their own templates ✅
- No shared templates ✅
- Complete workout isolation per user ✅

---

## 🎓 Rationale

### Why This Rule?

1. **Data Isolation**: Each user's workout data is completely separate
2. **Privacy**: No cross-user template access
3. **Simplicity**: Clear ownership model
4. **Security**: Prevents unauthorized data access
5. **Flexibility**: Users still have full control via empty workouts

### Design Principle

> "A user's workout is their personal training log. Templates are personal training plans. Both should be private and isolated."

---

## 🧪 Testing Scenarios

### Test 1: Own Template ✅

```
User ID: 1
Template ID: 5 (owner_id = 1)
Result: Success - workout created
```

### Test 2: Other User's Template ❌

```
User ID: 1
Template ID: 10 (owner_id = 2)
Result: HTTP 403 Forbidden
```

### Test 3: Empty Workout ✅

```
User ID: 1
Template ID: null
Result: Success - empty workout created
```

### Test 4: Non-existent Template ❌

```
User ID: 1
Template ID: 9999 (does not exist)
Result: HTTP 404 Not Found
```

---

## 📝 Error Messages

| Scenario                         | HTTP Code | Message                                                    |
| -------------------------------- | --------- | ---------------------------------------------------------- |
| Template not found               | 404       | "Template with ID {id} not found"                          |
| Template owned by another user   | 403       | "You can only start workouts from your own templates"      |
| Accessing another user's workout | 403       | "You don't have permission to access this workout session" |
| Invalid JWT token                | 401       | "Unauthorized"                                             |

---

## ✅ Summary

**Simple Rule:**

- ✅ Use YOUR templates
- ✅ Start empty workouts
- ✅ Add/remove/modify anything during the workout
- ❌ Cannot use other users' templates

**Complete workout flexibility within strict ownership boundaries!**
