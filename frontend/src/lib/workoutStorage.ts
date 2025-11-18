export interface SavedWorkout {
  id: string;
  name: string;
  date: string;
  timestamp: number;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: string;
      weight: string;
      rpe?: number;
    }>;
  }>;
  duration: number;
  totalVolume: number;
}

const STORAGE_KEY = 'workout_history';

export const saveWorkout = (workout: Omit<SavedWorkout, 'id' | 'timestamp'>): void => {
  const workouts = getWorkoutHistory();
  const newWorkout: SavedWorkout = {
    ...workout,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  
  workouts.unshift(newWorkout);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
};

export const getWorkoutHistory = (): SavedWorkout[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const formatWorkoutDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};
