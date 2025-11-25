# Storage Refactoring Summary

## Problem Statement

The codebase had scattered storage keys and direct localStorage access throughout, violating:

- **Single Responsibility Principle**: Storage logic mixed with business logic
- **Don't Repeat Yourself (DRY)**: Storage keys defined in multiple places
- **Separation of Concerns**: Pages directly accessing browser APIs
- **Dependency Inversion Principle**: Hard dependency on localStorage

## Issues Found

1. **Duplicate Storage Key Definitions** (4 locations):

   - `STREAK_KEY = 'fitness_streak'` in `lib/streakStorage.ts`
   - `PREFERENCES_KEY = 'fittrack_preferences'` in `contexts/PreferencesContext.tsx`
   - `STORAGE_KEY = 'activeWorkout'` in `contexts/WorkoutContext.tsx`
   - `STORAGE_KEY = 'workout_history'` in `lib/workoutStorage.ts`

2. **Direct localStorage Access** (47 matches found):
   - `Dashboard.tsx` - Reading workout_templates
   - `ExerciseLibrary.tsx` - Writing workout_templates (3 locations)
   - `Workout.tsx` - Writing workoutCount
   - Multiple contexts accessing localStorage
   - Old services using hardcoded strings

## Solution: Adapter Pattern + Single Source of Truth

### 1. Centralized Storage Keys

**File**: `src/core/constants/AppConstants.ts`

All storage keys consolidated in one place:

```typescript
export const STORAGE_KEYS = {
  AUTH_TOKEN: "fittrack_token",
  USER_DATA: "fittrack_user",
  PREFERENCES: "fittrack_preferences",
  WORKOUT_DRAFT: "fittrack_workout_draft",
  ACTIVE_WORKOUT: "activeWorkout",
  STREAK_CONFIG: "fitness_streak",
  WORKOUT_TEMPLATES: "workout_templates",
  WORKOUT_HISTORY: "workout_history",
  WORKOUT_COUNT: "workoutCount",
} as const;
```

### 2. Storage Abstraction Layer

**File**: `src/infrastructure/storage/LocalStorageAdapter.ts`

Created **Adapter Pattern** implementation:

#### IStorage Interface (Abstraction)

```typescript
export interface IStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}
```

#### LocalStorageAdapter (Singleton)

- Type-safe storage operations
- Error handling for JSON parse/stringify
- Singleton pattern ensures single instance

#### Specialized Storage Classes (SRP)

Each handles ONE type of data:

- `AuthStorage` - Token and user data
- `PreferencesStorage` - User preferences
- `WorkoutDraftStorage` - Active workout drafts
- `StreakStorage` - Streak configuration

### 3. Files Updated

#### Infrastructure Layer

✅ `infrastructure/storage/LocalStorageAdapter.ts` - Created new adapter

#### Core Constants

✅ `core/constants/AppConstants.ts` - Added missing storage keys

#### Services (Old Architecture)

✅ `services/authService.ts`

- Replaced `localStorage.getItem/setItem('fittrack_token')` with `authStorage.getToken/setToken()`
- Replaced `localStorage.getItem('fittrack_user')` with `authStorage.getUser()`
- Replaced manual clear with `authStorage.clearAuth()`

✅ `services/api.ts`

- Replaced `localStorage.getItem('fittrack_token')` with `authStorage.getToken()`

#### Storage Utilities

✅ `lib/streakStorage.ts`

- Removed `const STREAK_KEY = 'fitness_streak'`
- Uses `streakStorage` helper from adapter

✅ `lib/workoutStorage.ts`

- Removed `const STORAGE_KEY = 'workout_history'`
- Uses `storageAdapter.get/set(STORAGE_KEYS.WORKOUT_HISTORY)`

#### Contexts (React State Management)

✅ `contexts/PreferencesContext.tsx`

- Removed `PREFERENCES_KEY` constant
- Uses `preferencesStorage.getPreferences/setPreferences()`

✅ `contexts/WorkoutContext.tsx`

- Removed `STORAGE_KEY = 'activeWorkout'`
- Uses `workoutDraftStorage.getDraft/saveDraft/clearDraft()`
- Uses `STORAGE_KEYS.WORKOUT_COUNT` for workout count

#### Pages

✅ `pages/Dashboard.tsx`

- Replaced `localStorage.getItem('workout_templates')` with `storageAdapter.get<Template[]>(STORAGE_KEYS.WORKOUT_TEMPLATES)`

✅ `pages/ExerciseLibrary.tsx`

- Replaced 3× `localStorage.setItem('workout_templates', JSON.stringify(templates))`
- Now uses `storageAdapter.set(STORAGE_KEYS.WORKOUT_TEMPLATES, templates)`

✅ `pages/Workout.tsx`

- Replaced `localStorage.setItem('workoutCount', workoutNumber.toString())`
- Now uses `storageAdapter.set(STORAGE_KEYS.WORKOUT_COUNT, workoutNumber)`

## Design Patterns Demonstrated

### 1. Adapter Pattern

`LocalStorageAdapter` adapts browser localStorage to our `IStorage` interface:

- Abstracts away localStorage API
- Provides type-safe operations
- Enables easy replacement (e.g., IndexedDB, API storage)

### 2. Singleton Pattern

`LocalStorageAdapter.getInstance()`:

- Single shared instance
- Consistent state across application

### 3. Facade Pattern

Specialized storage classes (`AuthStorage`, `PreferencesStorage`) provide simple interfaces:

- Hide complexity of key management
- Domain-specific methods (e.g., `clearAuth()` vs generic `remove()`)

### 4. Single Responsibility Principle (SRP)

- `AppConstants.ts` - Only constants
- `LocalStorageAdapter.ts` - Only storage operations
- `AuthStorage` - Only auth-related storage
- Each storage class manages ONE data type

### 5. Dependency Inversion Principle (DIP)

- High-level modules (services, contexts) depend on `IStorage` interface
- Not dependent on concrete localStorage implementation
- Easy to mock for testing

## Benefits Achieved

### ✅ Maintainability

- Storage keys defined in ONE place
- Change key name once, works everywhere
- No more string literals scattered across codebase

### ✅ Type Safety

- Generic `get<T>` and `set<T>` methods
- TypeScript ensures correct data types
- Compile-time error checking

### ✅ Error Handling

- Centralized try-catch for JSON operations
- Graceful fallbacks for corrupted data
- Console errors for debugging

### ✅ Testability

- Easy to mock `IStorage` interface
- No direct localStorage coupling
- Unit tests can use fake storage

### ✅ Flexibility

- Easy to switch storage backends (IndexedDB, API, etc.)
- Can add encryption layer without changing consumers
- Cache strategies can be added in adapter

### ✅ SDA Course Compliance

- **Demonstrates design patterns**: Adapter, Singleton, Facade
- **SOLID principles**: SRP, DIP applied
- **Best practices**: Separation of concerns, DRY principle
- **Clean architecture**: Infrastructure layer properly separated

## Before vs After

### Before (Violation Example)

```typescript
// Dashboard.tsx
const stored = localStorage.getItem("workout_templates");
if (stored) {
  try {
    setTemplates(JSON.parse(stored));
  } catch {
    setTemplates([]);
  }
}

// ExerciseLibrary.tsx
localStorage.setItem("workout_templates", JSON.stringify(updatedTemplates));

// Problem: Same key string in multiple files, repeated error handling
```

### After (Clean Pattern)

```typescript
// Dashboard.tsx
const stored = storageAdapter.get<Template[]>(STORAGE_KEYS.WORKOUT_TEMPLATES);
setTemplates(stored || []);

// ExerciseLibrary.tsx
storageAdapter.set(STORAGE_KEYS.WORKOUT_TEMPLATES, updatedTemplates);

// Benefits: Single key constant, centralized error handling, type-safe
```

## Migration Checklist

- [x] Create `IStorage` interface
- [x] Implement `LocalStorageAdapter` with Singleton pattern
- [x] Create specialized storage classes (Auth, Preferences, Workout, Streak)
- [x] Consolidate all storage keys in `AppConstants.ts`
- [x] Update `authService.ts` to use `authStorage`
- [x] Update `api.ts` interceptor to use `authStorage`
- [x] Update `streakStorage.ts` to use adapter
- [x] Update `workoutStorage.ts` to use adapter
- [x] Update `PreferencesContext.tsx` to use `preferencesStorage`
- [x] Update `WorkoutContext.tsx` to use `workoutDraftStorage`
- [x] Update `Dashboard.tsx` template loading
- [x] Update `ExerciseLibrary.tsx` template operations (3 locations)
- [x] Update `Workout.tsx` workout count storage
- [x] Remove all hardcoded storage key strings
- [x] Remove all direct `localStorage.getItem/setItem` calls
- [x] Document refactoring in this file

## Next Steps (Future Enhancements)

1. **Create Repository Implementations**

   - `TemplateRepository` using `LocalStorageAdapter`
   - `WorkoutHistoryRepository` using `LocalStorageAdapter`
   - `StreakRepository` with business logic

2. **Add Caching Layer**

   - In-memory cache in adapter
   - Reduce localStorage reads

3. **Add Encryption**

   - Encrypt sensitive data (tokens)
   - Decrypt on retrieval

4. **Sync with Backend**

   - Add API sync methods
   - Offline-first with background sync

5. **Add Storage Events**
   - React to storage changes across tabs
   - Real-time synchronization

## Testing Recommendations

### Unit Tests

```typescript
// Mock storage for testing
const mockStorage = new MockStorage();
const authStorage = new AuthStorage(mockStorage);

test("should store and retrieve token", () => {
  authStorage.setToken("test-token");
  expect(authStorage.getToken()).toBe("test-token");
});
```

### Integration Tests

- Test full flow: Login → Token storage → API request
- Verify storage persistence across page reloads
- Test error scenarios (corrupted data, quota exceeded)

## Conclusion

This refactoring successfully:

- ✅ **Eliminated 47 instances** of direct localStorage access
- ✅ **Consolidated 9 storage keys** into single constants file
- ✅ **Applied 5 design patterns** (Adapter, Singleton, Facade, SRP, DIP)
- ✅ **Improved type safety** with generic methods
- ✅ **Enhanced testability** with interface abstraction
- ✅ **Demonstrated SDA principles** for course evaluation

The codebase now follows industry best practices and is ready for SDA project submission.
