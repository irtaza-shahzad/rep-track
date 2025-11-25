/**
 * Axios HTTP Client Adapter
 * Implements IHttpClient interface using axios
 * Following Adapter Pattern - adapts axios to our interface
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { IHttpClient, RequestConfig, HttpResponse, HttpError } from '../../core/interfaces/IHttpClient';
import { API_CONFIG, STORAGE_KEYS } from '../../core/constants/AppConstants';
import {
    ApplicationException,
    AuthenticationException,
    NetworkException,
    ValidationException,
} from '../../core/exceptions/ApplicationExceptions';

/**
 * Axios implementation of HTTP client
 * Singleton pattern - only one instance
 */
export class AxiosHttpClient implements IHttpClient {
    private static instance: AxiosHttpClient;
    private axiosInstance: AxiosInstance;

    private constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): AxiosHttpClient {
        if (!AxiosHttpClient.instance) {
            AxiosHttpClient.instance = new AxiosHttpClient();
        }
        return AxiosHttpClient.instance;
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors(): void {
        // Request interceptor - add auth token
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(this.handleError(error));
            }
        );

        // Response interceptor - handle errors
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * Handle and transform errors to application exceptions
     */
    private handleError(error: AxiosError): ApplicationException {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = (error.response.data as any)?.detail || error.message;

            switch (status) {
                case 401:
                    // Clear auth data on authentication error
                    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
                    return new AuthenticationException(message);

                case 400:
                    return new ValidationException(message);

                case 404:
                case 403:
                case 422:
                    return new ApplicationException(message, 'API_ERROR', status);

                default:
                    return new ApplicationException(message, 'SERVER_ERROR', status);
            }
        } else if (error.request) {
            // Request made but no response
            return new NetworkException('No response from server');
        } else {
            // Error setting up request
            return new ApplicationException(error.message, 'REQUEST_ERROR');
        }
    }

    /**
     * Transform axios response to our HttpResponse
     */
    private transformResponse<T>(response: AxiosResponse<T>): HttpResponse<T> {
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
        };
    }

    // IHttpClient implementation

    async get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.get<T>(url, config);
        return this.transformResponse(response);
    }

    async post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.post<T>(url, data, config);
        return this.transformResponse(response);
    }

    async put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.put<T>(url, data, config);
        return this.transformResponse(response);
    }

    async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.patch<T>(url, data, config);
        return this.transformResponse(response);
    }

    async delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.delete<T>(url, config);
        return this.transformResponse(response);
    }
}

/**
 * Export singleton instance
 */
export const httpClient = AxiosHttpClient.getInstance();
