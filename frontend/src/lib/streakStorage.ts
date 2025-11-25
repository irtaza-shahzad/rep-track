import { streakStorage as storage } from '../infrastructure/storage/LocalStorageAdapter';

export interface StreakConfig {
  targetDaysPerWeek: number;
  startDate: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  weeklyProgress: { [weekKey: string]: number };
}

export const getStreakConfig = (): StreakConfig | null => {
  return storage.getStreakConfig();
};

export const saveStreakConfig = (config: StreakConfig): void => {
  storage.setStreakConfig(config);
};

export const initializeStreak = (targetDaysPerWeek: number): StreakConfig => {
  const config: StreakConfig = {
    targetDaysPerWeek,
    startDate: new Date().toISOString(),
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    weeklyProgress: {},
  };

  saveStreakConfig(config);
  return config;
};

export const updateStreakOnWorkout = (): void => {
  const config = getStreakConfig();
  if (!config) return;

  const today = new Date().toISOString().split('T')[0];
  const lastWorkout = config.lastWorkoutDate;

  // If already worked out today, don't update
  if (lastWorkout === today) return;

  // Check if streak continues (workout within last day)
  if (lastWorkout) {
    const lastDate = new Date(lastWorkout);
    const currentDate = new Date(today);
    const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      config.currentStreak += 1;
    } else if (daysDiff > 1) {
      config.currentStreak = 1; // Reset streak
    }
  } else {
    config.currentStreak = 1;
  }

  // Update longest streak
  if (config.currentStreak > config.longestStreak) {
    config.longestStreak = config.currentStreak;
  }

  config.lastWorkoutDate = today;

  // Update weekly progress
  const weekKey = getWeekKey(new Date(today));
  config.weeklyProgress[weekKey] = (config.weeklyProgress[weekKey] || 0) + 1;

  saveStreakConfig(config);
};

export const getCurrentWeekProgress = (): number => {
  const config = getStreakConfig();
  if (!config) return 0;

  const weekKey = getWeekKey(new Date());
  return config.weeklyProgress[weekKey] || 0;
};

const getWeekKey = (date: Date): string => {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week}`;
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
