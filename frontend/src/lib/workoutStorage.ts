import { STORAGE_KEYS } from '../core/constants/AppConstants';
import { storageAdapter } from '../infrastructure/storage/LocalStorageAdapter';

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

export const saveWorkout = (workout: Omit<SavedWorkout, 'id' | 'timestamp'>): void => {
  const workouts = getWorkoutHistory();
  const newWorkout: SavedWorkout = {
    ...workout,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };

  workouts.unshift(newWorkout);
  storageAdapter.set(STORAGE_KEYS.WORKOUT_HISTORY, workouts);
};

export const getWorkoutHistory = (): SavedWorkout[] => {
  const stored = storageAdapter.get<SavedWorkout[]>(STORAGE_KEYS.WORKOUT_HISTORY);
  return stored || [];
};

export const formatWorkoutDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
