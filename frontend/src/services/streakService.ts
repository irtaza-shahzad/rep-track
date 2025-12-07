import { api } from './api';

export interface Streak {
    id: number;
    user_id: number;
    current_streak: number;
    longest_streak: number;
    last_trained_date: string | null;
    target_days_per_week: number;
    workouts_this_week: number;
    week_start_date: string;
}

export interface StreakCreate {
    target_days_per_week: number;
}

export interface StreakUpdate {
    target_days_per_week: number;
}

/**
 * Start a new streak for the current user
 */
export async function startStreak(targetDaysPerWeek: number): Promise<Streak> {
    const response = await api.post<{ data: Streak }>('/api/streak/start', {
        target_days_per_week: targetDaysPerWeek
    });
    return response.data.data;
}

/**
 * Get current user's streak (returns null if not started)
 */
export async function getMyStreak(): Promise<Streak | null> {
    try {
        const response = await api.get<{ data: Streak | null }>('/api/streak/me');
        return response.data.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null; // Streak not started yet
        }
        throw error;
    }
}

/**
 * Update target days per week
 */
export async function updateTargetDays(targetDaysPerWeek: number): Promise<Streak> {
    const response = await api.put<{ data: Streak }>('/api/streak/update', {
        target_days_per_week: targetDaysPerWeek
    });
    return response.data.data;
}

/**
 * Reset current user's streak to zero
 */
export async function resetStreak(): Promise<Streak> {
    const response = await api.delete<{ data: Streak }>('/api/streak/reset');
    return response.data.data;
}

/**
 * Get streak leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<Streak[]> {
    const response = await api.get<{ data: Streak[] }>('/api/streak/leaderboard', {
        params: { limit }
    });
    return response.data.data;
}
