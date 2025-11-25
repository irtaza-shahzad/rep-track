/**
 * Application-wide Constants
 * Single source of truth for configuration values
 */

export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
} as const;

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'fittrack_token',
    USER_DATA: 'fittrack_user',
    PREFERENCES: 'fittrack_preferences',
    WORKOUT_DRAFT: 'fittrack_workout_draft',
    ACTIVE_WORKOUT: 'activeWorkout',
    STREAK_CONFIG: 'fitness_streak',
    WORKOUT_TEMPLATES: 'workout_templates',
    WORKOUT_HISTORY: 'workout_history',
    WORKOUT_COUNT: 'workoutCount',
} as const;

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    WORKOUT: '/workout',
    HISTORY: '/history',
    EXERCISES: '/exercises',
    STATS: '/stats',
    SETTINGS: '/settings',
    REMINDERS: '/reminders',
} as const;

export const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    SET_RPE_MIN: 1,
    SET_RPE_MAX: 10,
    WEIGHT_MIN: 0,
    REPS_MIN: 0,
} as const;

export const DEFAULTS = {
    WORKOUT_REST_TIME: 90, // seconds
    WEIGHT_UNIT: 'lbs',
    DISTANCE_UNIT: 'miles',
    TIME_FORMAT: '12h',
    PAGE_SIZE: 20,
} as const;
