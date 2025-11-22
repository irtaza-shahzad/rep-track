import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

const STORAGE_KEY = 'activeWorkout';

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutState | null>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Persist to localStorage whenever activeWorkout changes
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeWorkout]);

  const startWorkout = (initialExercises: Exercise[] = []) => {
    const count = parseInt(localStorage.getItem('workoutCount') || '0');
    const workoutNum = count + 1;
    
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

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
