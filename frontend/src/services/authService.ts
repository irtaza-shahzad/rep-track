import { api } from './api';
import { authStorage } from '../infrastructure/storage/LocalStorageAdapter';

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
        console.log('Login request:', { ...credentials, password: '***' });

        const response = await api.post('/api/auth/login', {
            email: credentials.email,
            password: credentials.password
        });
        console.log('Login response:', response.data);

        // Extract data from the APIResponse wrapper
        const responseData = response.data.data || response.data;
        console.log('Extracted response data:', responseData);

        // Store token and user data using storage adapter
        authStorage.setToken(responseData.access_token);
        authStorage.setUser(responseData.user);

        return responseData;
    },

    // Register
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        console.log('Register request:', { ...data, password: '***' });

        const response = await api.post('/api/auth/signup', data);
        console.log('Register response:', response.data);

        // Extract data from the APIResponse wrapper
        const responseData = response.data.data || response.data;
        console.log('Extracted response data:', responseData);

        // DO NOT store token/user - user needs to login after registration
        // This ensures proper authentication flow

        return responseData;
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
