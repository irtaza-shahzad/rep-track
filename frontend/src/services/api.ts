import axios from 'axios';
import { authStorage } from '../infrastructure/storage/LocalStorageAdapter';
import { API_CONFIG } from '../core/constants/AppConstants';
import { logger } from '../lib/logger';

export const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 404) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') ||
                error.config?.url?.includes('/api/auth/signup') ||
                error.config?.url?.includes('/api/auth/me');

            if (!isAuthEndpoint) {
                authStorage.clearAuth();
                window.location.href = '/';
            }
        }

        if (error.response?.status !== 404) {
            logger.error('API request failed', {
                status: error.response?.status,
                url: error.config?.url,
                method: error.config?.method,
            });
        }
        return Promise.reject(error);
    }
);
