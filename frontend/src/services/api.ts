import axios from 'axios';
import { authStorage } from '../infrastructure/storage/LocalStorageAdapter';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests automatically
api.interceptors.request.use(
    (config) => {
        const token = authStorage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Suppress 404 errors from console (handled gracefully in service layer)
        if (error.response?.status === 404) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            // Only redirect to landing page if this is NOT a login/signup request
            // Login/signup 401s should be handled by the Login component
            const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') ||
                error.config?.url?.includes('/api/auth/signup');

            if (!isAuthEndpoint) {
                // Token expired or invalid on protected route
                authStorage.clearAuth();
                window.location.href = '/';
            }
        }

        // Log other errors to console (except 404s which are suppressed above)
        if (error.response?.status !== 404) {
            console.error('API Error:', error);
        }
        return Promise.reject(error);
    }
);
