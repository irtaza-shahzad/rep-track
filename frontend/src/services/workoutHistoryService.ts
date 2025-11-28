/**
 * Workout History Service with Caching
 * Fetches user's workout history from backend with intelligent caching
 */

import { api } from './api';

export interface WorkoutHistoryItem {
    id: number;
    workout_number: number;
    workout_name: string;
    start_time: number; // epoch ms
    elapsed_seconds: number;
    total_volume: number | null;
    total_sets: number | null;
    exercises_count: number | null;
}

export interface WorkoutDetail {
    id: number;
    workout_number: number;
    workout_name: string;
    start_time: number;
    end_time: number | null;
    elapsed_seconds: number;
    total_volume: number | null;
    total_sets: number | null;
    total_reps: number | null;
    exercises_count: number | null;
    notes: string | null;
    exercises: Array<{
        id: number;
        name: string;
        sets: Array<{
            id: number;
            position: number;
            reps: string;
            weight: string;
            rpe: number | null;
            completed: boolean;
            is_warmup: boolean;
            is_dropset: boolean;
            is_failure: boolean;
            completed_at: number | null;
        }>;
        notes: string | null;
    }>;
    template_id: number | null;
}

export interface WorkoutStats {
    total_workouts: number;
    current_streak: number;
    total_volume: number;
    total_sets: number;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEYS = {
    WORKOUT_HISTORY: 'workout_history_cache',
    WORKOUT_STATS: 'workout_stats_cache',
    WORKOUT_DETAILS: 'workout_details_cache_',
} as const;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: number; // Track data version for invalidation
}

// Global cache version - increment when workouts are modified
let cacheVersion = Date.now();

/**
 * Invalidate all workout caches (call after creating/updating/deleting workouts)
 */
export const invalidateWorkoutCache = (): void => {
    cacheVersion = Date.now();
    // Clear localStorage caches
    localStorage.removeItem(CACHE_KEYS.WORKOUT_HISTORY);
    localStorage.removeItem(CACHE_KEYS.WORKOUT_STATS);
    // Clear workout detail caches
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEYS.WORKOUT_DETAILS)) {
            localStorage.removeItem(key);
        }
    });
};

/**
 * Check if cache entry is valid
 */
const isCacheValid = <T>(entry: CacheEntry<T> | null): boolean => {
    if (!entry) return false;
    const now = Date.now();
    const isExpired = now - entry.timestamp > CACHE_DURATION;
    const isStale = entry.version !== cacheVersion;
    return !isExpired && !isStale;
};

/**
 * Get from cache
 */
const getFromCache = <T>(key: string): T | null => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);
        return isCacheValid(entry) ? entry.data : null;
    } catch {
        return null;
    }
};

/**
 * Save to cache
 */
const saveToCache = <T>(key: string, data: T): void => {
    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            version: cacheVersion,
        };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
        console.warn('Failed to cache data:', error);
    }
};

/**
 * Get workout history with caching
 */
export const getWorkoutHistory = async (
    limit: number = 50,
    offset: number = 0,
    forceRefresh: boolean = false
): Promise<WorkoutHistoryItem[]> => {
    const cacheKey = `${CACHE_KEYS.WORKOUT_HISTORY}_${limit}_${offset}`;

    // If forceRefresh is true, skip cache and clear it
    if (forceRefresh) {
        localStorage.removeItem(cacheKey);
    } else {
        // Check cache first only if not forcing refresh
        const cached = getFromCache<WorkoutHistoryItem[]>(cacheKey);
        if (cached) {
            return cached;
        }
    }

    // Fetch from API
    const response = await api.get('/api/workouts', {
        params: { limit, offset },
    });

    const data = response.data as WorkoutHistoryItem[];

    // Save to cache
    saveToCache(cacheKey, data);

    return data;
};

/**
 * Get workout detail with caching
 */
export const getWorkoutDetail = async (workoutId: number): Promise<WorkoutDetail> => {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.WORKOUT_DETAILS}${workoutId}`;
    const cached = getFromCache<WorkoutDetail>(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from API
    const response = await api.get(`/api/workouts/${workoutId}`);

    const data = response.data as WorkoutDetail;

    // Save to cache
    saveToCache(cacheKey, data);

    return data;
};

/**
 * Get workout stats with caching
 */
export const getWorkoutStats = async (forceRefresh: boolean = false): Promise<WorkoutStats> => {
    // If forceRefresh is true, skip cache and clear it
    if (forceRefresh) {
        localStorage.removeItem(CACHE_KEYS.WORKOUT_STATS);
    } else {
        // Check cache first only if not forcing refresh
        const cached = getFromCache<WorkoutStats>(CACHE_KEYS.WORKOUT_STATS);
        if (cached) {
            return cached;
        }
    }

    // Fetch from API
    const response = await api.get('/api/workouts/stats/summary');

    const data = response.data as WorkoutStats;

    // Save to cache
    saveToCache(CACHE_KEYS.WORKOUT_STATS, data);

    return data;
};

/**
 * Format epoch milliseconds to readable date
 */
export const formatWorkoutDate = (epochMs: number): string => {
    const date = new Date(epochMs);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

/**
 * Format seconds to duration string
 */
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

/**
 * Get relative date (Today, Yesterday, X days ago)
 */
export const getRelativeDate = (epochMs: number): string => {
    const now = Date.now();
    const diff = now - epochMs;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatWorkoutDate(epochMs);
};
