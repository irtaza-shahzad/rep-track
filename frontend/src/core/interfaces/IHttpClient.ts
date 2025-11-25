/**
 * HTTP Client Interface
 * Abstraction for HTTP operations (Adapter Pattern)
 * Allows swapping axios with fetch or other libraries
 */

export interface IHttpClient {
    get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
    post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
    delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
}

export interface RequestConfig {
    headers?: Record<string, string>;
    params?: Record<string, any>;
    timeout?: number;
}

export interface HttpResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

export interface HttpError {
    message: string;
    status?: number;
    code?: string;
    response?: HttpResponse;
}
