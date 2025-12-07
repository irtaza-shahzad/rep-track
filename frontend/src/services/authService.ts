import { api } from './api';
import { authStorage } from '../infrastructure/storage/LocalStorageAdapter';
import { statsService } from './statsService';
import { invalidateWorkoutCache } from './workoutHistoryService';
import { workoutDraftStorage } from '../infrastructure/storage/LocalStorageAdapter';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type?: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export const authService = {
    // Login
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/login', {
            email: credentials.email,
            password: credentials.password
        });

        // Extract data from the APIResponse wrapper
        const responseData = response.data.data || response.data;

        // Store token and user data using storage adapter
        authStorage.setToken(responseData.access_token);
        authStorage.setUser(responseData.user);

        // Invalidate any cached data from previous user
        statsService.invalidate();
        invalidateWorkoutCache();
        workoutDraftStorage.clearDraft(); // Clear any workout draft from previous user

        return responseData;
    },

    // Register
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/signup', data);

        // Extract data from the APIResponse wrapper
        const responseData = response.data.data || response.data;

        // DO NOT store token/user - user needs to login after registration
        // This ensures proper authentication flow

        // Invalidate any cached data from previous user
        statsService.invalidate();
        invalidateWorkoutCache();
        workoutDraftStorage.clearDraft(); // Clear any workout draft from previous user

        return responseData;
    },

    // Logout
    logout: () => {
        // Clear all user-specific data from localStorage
        // This includes: auth token, user data, workout drafts, preferences,
        // streak configs, and all cached API data
        authStorage.clearAuth();

        // Invalidate any cached API data
        statsService.invalidate();
        invalidateWorkoutCache();
        workoutDraftStorage.clearDraft(); // Explicitly clear workout draft

        // Note: WorkoutContext will automatically clear when the app re-renders
        // after navigation to login, as it loads from localStorage (now empty)
    },

    // Get current user
    getCurrentUser: () => {
        return authStorage.getUser();
    },

    // Check if authenticated
    isAuthenticated: (): boolean => {
        return authStorage.isAuthenticated();
    },
};
