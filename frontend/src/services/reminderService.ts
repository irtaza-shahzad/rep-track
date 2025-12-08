import { api } from './api';

export interface Reminder {
    id: number;
    user_id: number;
    reminder_type: 'Scheduled';
    title: string;
    description: string | null;
    scheduled_time: string | null;
    days_of_week: number[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ReminderCreate {
    reminder_type?: 'Scheduled';
    title: string;
    description?: string;
    scheduled_time: string;
    days_of_week: number[];
    is_active?: boolean;
}

export interface ReminderUpdate {
    title?: string;
    description?: string;
    scheduled_time?: string;
    days_of_week?: number[];
    is_active?: boolean;
}

interface APIResponse<T> {
    status_code: number;
    message: string;
    data: T;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for full reminders list
let remindersCache: { data: Reminder[]; timestamp: number } | null = null;

export const reminderService = {
    /**
     * Create a new reminder
     */
    async createReminder(reminder: ReminderCreate): Promise<Reminder> {
        const response = await api.post<APIResponse<Reminder>>('/reminders', reminder);
        // Invalidate cache when creating new reminder
        remindersCache = null;
        return response.data.data;
    },

    /**
     * Get all reminders for the current user (with caching)
     */
    async getAllReminders(forceRefresh = false): Promise<Reminder[]> {
        // Check if we have valid cached data
        if (!forceRefresh && remindersCache && Date.now() - remindersCache.timestamp < CACHE_DURATION) {
            return remindersCache.data;
        }

        // Fetch fresh data
        const response = await api.get<APIResponse<Reminder[]>>('/reminders');
        const data = response.data.data;

        // Update cache
        remindersCache = {
            data,
            timestamp: Date.now(),
        };

        return data;
    },

    /**
     * Get currently active reminders that should be displayed now
     * This is used for polling to check for reminders to show
     */
    async getActiveReminders(): Promise<Reminder[]> {
        const response = await api.get<APIResponse<Reminder[]>>('/reminders/active');
        return response.data.data;
    },

    /**
     * Get a specific reminder by ID
     */
    async getReminder(reminderId: number): Promise<Reminder> {
        const response = await api.get<APIResponse<Reminder>>(`/reminders/${reminderId}`);
        return response.data.data;
    },

    /**
     * Update an existing reminder
     */
    async updateReminder(reminderId: number, updates: ReminderUpdate): Promise<Reminder> {
        const response = await api.put<APIResponse<Reminder>>(`/reminders/${reminderId}`, updates);
        // Invalidate cache when updating
        remindersCache = null;
        return response.data.data;
    },

    /**
     * Delete a reminder
     */
    async deleteReminder(reminderId: number): Promise<Reminder> {
        const response = await api.delete<APIResponse<Reminder>>(`/reminders/${reminderId}`);
        // Invalidate cache when deleting
        remindersCache = null;
        return response.data.data;
    },

    /**
     * Toggle reminder active status (enable/disable)
     */
    async toggleReminder(reminderId: number): Promise<Reminder> {
        const response = await api.patch<APIResponse<Reminder>>(`/reminders/${reminderId}/toggle`);
        // Invalidate cache when toggling
        remindersCache = null;
        return response.data.data;
    },

    /**
     * Invalidate the reminders cache (useful after logout)
     */
    invalidateCache(): void {
        remindersCache = null;
    },
};
