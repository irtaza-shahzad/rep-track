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
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('fittrack_token');
            localStorage.removeItem('fittrack_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);
