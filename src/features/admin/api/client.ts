/**
 * Admin API client with shared refresh promise to prevent concurrent refresh race conditions.
 * Uses separate localStorage keys (admin_access_token) to avoid conflicts with user sessions.
 */
import { ApiError } from '@/lib/apiError';

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'https://api.flowkyn.com/v1';

class AdminApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('admin_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const fullUrl = `${this.baseUrl}${path}`;
    const url = new URL(fullUrl, fullUrl.startsWith('http') ? undefined : window.location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  async request<T>(path: string, options: RequestInit & { params?: Record<string, string> } = {}): Promise<T> {
    const { params, ...fetchOptions } = options as any;
    const res = await fetch(this.buildUrl(path, params), {
      ...fetchOptions,
      headers: { ...this.getHeaders(), ...fetchOptions.headers },
    });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) return this.request<T>(path, options);
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
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

  private refreshToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (!refreshToken) return false;
        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem('admin_access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('admin_refresh_token', data.refresh_token);
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
    return this.request<T>(path, { method: 'GET', params } as any);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  del<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const adminClient = new AdminApiClient(ADMIN_API_BASE);
