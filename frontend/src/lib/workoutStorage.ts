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

// Function to seed mock workouts for development
export const seedMockWorkouts = (): void => {
  const existingWorkouts = getWorkoutHistory();
  if (existingWorkouts.length > 0) return; // Don't overwrite existing data

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const mockWorkouts: SavedWorkout[] = [
    {
      id: '1',
      name: 'Upper Body Power',
      date: formatWorkoutDate(now),
      timestamp: now,
      duration: 2700, // 45 minutes
      totalVolume: 8450,
      exercises: [
        {
          name: 'Barbell Bench Press',
          sets: [
            { reps: '8', weight: '185', rpe: 7 },
            { reps: '8', weight: '185', rpe: 8 },
            { reps: '6', weight: '195', rpe: 9 },
            { reps: '5', weight: '205', rpe: 9 },
          ]
        },
        {
          name: 'Barbell Bent-Over Row',
          sets: [
            { reps: '10', weight: '135', rpe: 6 },
            { reps: '10', weight: '155', rpe: 7 },
            { reps: '8', weight: '165', rpe: 8 },
            { reps: '7', weight: '175', rpe: 9 },
          ]
        },
        {
          name: 'Overhead Barbell Press',
          sets: [
            { reps: '10', weight: '95', rpe: 7 },
            { reps: '8', weight: '105', rpe: 8 },
            { reps: '6', weight: '115', rpe: 9 },
          ]
        },
        {
          name: 'Pull-Ups',
          sets: [
            { reps: '8', weight: '0', rpe: 7 },
            { reps: '7', weight: '0', rpe: 8 },
            { reps: '6', weight: '0', rpe: 9 },
          ]
        },
      ]
    },
    {
      id: '2',
      name: 'Leg Day',
      date: formatWorkoutDate(now - oneDay),
      timestamp: now - oneDay,
      duration: 3300, // 55 minutes
      totalVolume: 12350,
      exercises: [
        {
          name: 'Barbell Back Squat',
          sets: [
            { reps: '10', weight: '135', rpe: 6 },
            { reps: '8', weight: '185', rpe: 7 },
            { reps: '6', weight: '225', rpe: 8 },
            { reps: '5', weight: '245', rpe: 9 },
            { reps: '3', weight: '265', rpe: 10 },
          ]
        },
        {
          name: 'Romanian Deadlift',
          sets: [
            { reps: '10', weight: '135', rpe: 6 },
            { reps: '10', weight: '185', rpe: 7 },
            { reps: '8', weight: '205', rpe: 8 },
            { reps: '8', weight: '225', rpe: 9 },
          ]
        },
        {
          name: 'Leg Press',
          sets: [
            { reps: '12', weight: '270', rpe: 7 },
            { reps: '12', weight: '315', rpe: 8 },
            { reps: '10', weight: '360', rpe: 9 },
          ]
        },
        {
          name: 'Walking Lunges',
          sets: [
            { reps: '10', weight: '40', rpe: 7 },
            { reps: '10', weight: '45', rpe: 8 },
            { reps: '8', weight: '50', rpe: 9 },
          ]
        },
      ]
    },
    {
      id: '3',
      name: 'Push Day',
      date: formatWorkoutDate(now - 2 * oneDay),
      timestamp: now - 2 * oneDay,
      duration: 2400, // 40 minutes
      totalVolume: 6780,
      exercises: [
        {
          name: 'Incline Dumbbell Press',
          sets: [
            { reps: '10', weight: '70', rpe: 7 },
            { reps: '10', weight: '75', rpe: 8 },
            { reps: '8', weight: '80', rpe: 9 },
            { reps: '6', weight: '85', rpe: 10 },
          ]
        },
        {
          name: 'Dumbbell Shoulder Press',
          sets: [
            { reps: '10', weight: '45', rpe: 7 },
            { reps: '8', weight: '50', rpe: 8 },
            { reps: '8', weight: '55', rpe: 9 },
          ]
        },
        {
          name: 'Tricep Pushdowns',
          sets: [
            { reps: '12', weight: '60', rpe: 7 },
            { reps: '12', weight: '70', rpe: 8 },
            { reps: '10', weight: '80', rpe: 9 },
          ]
        },
        {
          name: 'Lateral Raises',
          sets: [
            { reps: '15', weight: '20', rpe: 8 },
            { reps: '12', weight: '25', rpe: 9 },
            { reps: '10', weight: '30', rpe: 9 },
          ]
        },
      ]
    },
    {
      id: '4',
      name: 'Pull Day',
      date: formatWorkoutDate(now - 3 * oneDay),
      timestamp: now - 3 * oneDay,
      duration: 2580, // 43 minutes
      totalVolume: 7920,
      exercises: [
        {
          name: 'Deadlift',
          sets: [
            { reps: '5', weight: '225', rpe: 7 },
            { reps: '5', weight: '275', rpe: 8 },
            { reps: '3', weight: '315', rpe: 9 },
            { reps: '1', weight: '365', rpe: 10 },
          ]
        },
        {
          name: 'Lat Pulldown',
          sets: [
            { reps: '10', weight: '130', rpe: 7 },
            { reps: '10', weight: '140', rpe: 8 },
            { reps: '8', weight: '150', rpe: 9 },
          ]
        },
        {
          name: 'Seated Cable Row',
          sets: [
            { reps: '12', weight: '120', rpe: 7 },
            { reps: '10', weight: '130', rpe: 8 },
            { reps: '10', weight: '140', rpe: 9 },
          ]
        },
        {
          name: 'Barbell Bicep Curls',
          sets: [
            { reps: '12', weight: '65', rpe: 7 },
            { reps: '10', weight: '75', rpe: 8 },
            { reps: '8', weight: '85', rpe: 9 },
          ]
        },
      ]
    },
    {
      id: '5',
      name: 'Full Body',
      date: formatWorkoutDate(now - 5 * oneDay),
      timestamp: now - 5 * oneDay,
      duration: 3000, // 50 minutes
      totalVolume: 9650,
      exercises: [
        {
          name: 'Barbell Front Squat',
          sets: [
            { reps: '8', weight: '135', rpe: 7 },
            { reps: '8', weight: '155', rpe: 8 },
            { reps: '6', weight: '175', rpe: 9 },
          ]
        },
        {
          name: 'Flat Dumbbell Press',
          sets: [
            { reps: '10', weight: '70', rpe: 7 },
            { reps: '8', weight: '75', rpe: 8 },
            { reps: '6', weight: '80', rpe: 9 },
          ]
        },
        {
          name: 'Single-Arm Dumbbell Row',
          sets: [
            { reps: '10', weight: '70', rpe: 7 },
            { reps: '10', weight: '75', rpe: 8 },
            { reps: '8', weight: '80', rpe: 9 },
          ]
        },
        {
          name: 'Arnold Press',
          sets: [
            { reps: '10', weight: '40', rpe: 8 },
            { reps: '8', weight: '45', rpe: 9 },
            { reps: '6', weight: '50', rpe: 9 },
          ]
        },
        {
          name: 'Planks',
          sets: [
            { reps: '60', weight: '0', rpe: 7 },
            { reps: '60', weight: '0', rpe: 8 },
            { reps: '45', weight: '0', rpe: 9 },
          ]
        },
      ]
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockWorkouts));
};
