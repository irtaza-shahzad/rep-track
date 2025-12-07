import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { STORAGE_KEYS } from '../core/constants/AppConstants';
import { workoutDraftStorage, storageAdapter, authStorage } from '../infrastructure/storage/LocalStorageAdapter';

// @refresh reset
// This file exports both a Provider component and a custom hook,
// which is a valid pattern for React Context

interface WorkoutSet {
  reps: string;
  weight: string;
  rpe?: number;
  completed?: boolean;
  isWarmup?: boolean;
  isDropset?: boolean;
  isFailure?: boolean;
}

interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutState {
  exercises: Exercise[];
  elapsedSeconds: number;
  isPaused: boolean;
  workoutNumber: number;
  workoutName: string;
  startTime: number;
}

interface WorkoutContextType {
  activeWorkout: WorkoutState | null;
  startWorkout: (initialExercises?: Exercise[]) => void;
  updateWorkout: (workout: WorkoutState) => void;
  endWorkout: () => void;
  hasActiveWorkout: () => boolean;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutState | null>(() => {
    // Only load from localStorage if user is authenticated
    // This prevents loading old user's workout draft after logout/login
    if (authStorage.isAuthenticated()) {
      const draft = workoutDraftStorage.getDraft();
      const currentUser = authStorage.getUser();
      
      // Verify the draft belongs to the current user
      if (draft && currentUser) {
        // If draft has userId, validate it matches current user
        if (draft.userId && draft.userId !== currentUser.id) {
          // Draft belongs to different user, clear it
          workoutDraftStorage.clearDraft();
          return null;
        }
      }
      
      return draft;
    }
    return null;
  });

  // Persist to localStorage whenever activeWorkout changes
  useEffect(() => {
    if (activeWorkout) {
      const currentUser = authStorage.getUser();
      // Store workout with user ID for validation
      const draftWithUserId = {
        ...activeWorkout,
        userId: currentUser?.id
      };
      workoutDraftStorage.saveDraft(draftWithUserId);
    } else {
      workoutDraftStorage.clearDraft();
    }
  }, [activeWorkout]);

  const startWorkout = (initialExercises: Exercise[] = []) => {
    const count = storageAdapter.get<number>(STORAGE_KEYS.WORKOUT_COUNT);
    const workoutNum = (count && typeof count === 'number' ? count : 0) + 1;
    
    setActiveWorkout({
      exercises: initialExercises,
      elapsedSeconds: 0,
      isPaused: false,
      workoutNumber: workoutNum,
      workoutName: '',
      startTime: Date.now(),
    });
  };

  const updateWorkout = (workout: WorkoutState) => {
    setActiveWorkout(workout);
  };

  const endWorkout = () => {
    setActiveWorkout(null);
  };

  const hasActiveWorkout = () => {
    return activeWorkout !== null;
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        updateWorkout,
        endWorkout,
        hasActiveWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

// Export hook separately for Fast Refresh compatibility
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
