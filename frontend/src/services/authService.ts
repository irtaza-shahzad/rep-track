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

export interface AuthUser {
    id: number;
    name: string;
    email: string;
}

export interface AuthResponse {
    user: AuthUser;
}

export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/login', {
            email: credentials.email,
            password: credentials.password,
        });

        const responseData = response.data.data || response.data;

        authStorage.setUser(responseData.user);

        statsService.invalidate();
        invalidateWorkoutCache();
        workoutDraftStorage.clearDraft();

        return responseData;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/signup', data);
        const responseData = response.data.data || response.data;

        statsService.invalidate();
        invalidateWorkoutCache();
        workoutDraftStorage.clearDraft();

        return responseData;
    },

    logout: async () => {
        try {
            await api.post('/api/auth/logout');
        } catch {
            // Clear local state even if the request fails
        }

        authStorage.clearAuth();
        statsService.invalidate();
        invalidateWorkoutCache();
        workoutDraftStorage.clearDraft();
    },

    restoreSession: async (): Promise<boolean> => {
        if (authStorage.getUser()) {
            return true;
        }

        try {
            const response = await api.get('/api/auth/me');
            const responseData = response.data.data || response.data;
            authStorage.setUser(responseData.user ?? responseData);
            return true;
        } catch {
            authStorage.clearAuth();
            return false;
        }
    },

    getCurrentUser: () => {
        return authStorage.getUser();
    },

    isAuthenticated: (): boolean => {
        return authStorage.getUser() !== null;
    },
};
