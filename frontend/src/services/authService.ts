import { api } from './api';
import { authStorage } from '../infrastructure/storage/LocalStorageAdapter';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    full_name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
        id: number;
        full_name: string;
        email: string;
    };
}

export const authService = {
    // Login
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        // FastAPI expects form data for OAuth2
        const formData = new FormData();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);

        const response = await api.post('/api/auth/login', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Store token and user data using storage adapter
        authStorage.setToken(response.data.access_token);
        authStorage.setUser(response.data.user);

        return response.data;
    },

    // Register
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/api/auth/register', data);

        // Store token and user data using storage adapter
        authStorage.setToken(response.data.access_token);
        authStorage.setUser(response.data.user);

        return response.data;
    },

    // Logout
    logout: () => {
        authStorage.clearAuth();
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
