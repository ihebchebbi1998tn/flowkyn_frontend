/** API client wrapper with JWT interceptor & refresh queue */
import { ApiError } from '@/lib/apiError';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.flowkyn.com/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(isMultipart = false): HeadersInit {
    const headers: HeadersInit = {};
    if (!isMultipart) headers['Content-Type'] = 'application/json';
    // Use guest token if available, otherwise use regular access token
    const token = localStorage.getItem('guest_token') || localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const fullUrl = `${this.baseUrl}${path}`;
    const url = new URL(fullUrl, fullUrl.startsWith('http') ? undefined : window.location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const res = await fetch(this.buildUrl(path, params), {
      ...fetchOptions,
      headers: { ...this.getHeaders(), ...fetchOptions.headers },
      credentials: 'include',
    });
    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) return this.request<T>(path, options);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new ApiError({
        error: 'Unauthorized',
        code: 'AUTH_TOKEN_EXPIRED',
        statusCode: 401,
        requestId: 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({
        error: 'Request failed',
        code: 'INTERNAL_ERROR' as const,
        statusCode: res.status,
        requestId: 'unknown',
        timestamp: new Date().toISOString(),
      }));
      throw new ApiError({
        error: body.error || `HTTP ${res.status}`,
        code: body.code || 'INTERNAL_ERROR',
        statusCode: body.statusCode || res.status,
        requestId: body.requestId || 'unknown',
        details: body.details,
        timestamp: body.timestamp || new Date().toISOString(),
      });
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  /**
   * Refresh token with shared promise — prevents multiple concurrent refresh attempts.
   * All concurrent 401 responses wait on the same refresh call.
   */
  private refreshToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;
        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  del<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /** Upload file using multipart/form-data (with 401 refresh support) */
  upload<T>(path: string, formData: FormData) {
    const doUpload = async (retry = true): Promise<T> => {
      const headers: HeadersInit = {};
      const token = localStorage.getItem('access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(this.buildUrl(path), {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      });

      // Handle 401 with token refresh (same pattern as request())
      if (res.status === 401 && retry) {
        const refreshed = await this.refreshToken();
        if (refreshed) return doUpload(false);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new ApiError({
          error: 'Unauthorized',
          code: 'AUTH_TOKEN_EXPIRED',
          statusCode: 401,
          requestId: 'unknown',
          timestamp: new Date().toISOString(),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({
          error: 'Upload failed',
          code: 'INTERNAL_ERROR' as const,
          statusCode: res.status,
          requestId: 'unknown',
          timestamp: new Date().toISOString(),
        }));
        throw new ApiError({
          error: body.error || `HTTP ${res.status}`,
          code: body.code || 'INTERNAL_ERROR',
          statusCode: body.statusCode || res.status,
          requestId: body.requestId || 'unknown',
          details: body.details,
          timestamp: body.timestamp || new Date().toISOString(),
        });
      }
      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    };
    return doUpload();
  }
}

export const api = new ApiClient(API_BASE);
