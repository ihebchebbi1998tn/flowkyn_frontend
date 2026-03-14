/**
 * App API client with shared refresh promise to prevent concurrent refresh race conditions.
 * Uses localStorage: access_token, refresh_token for logged-in users;
 * guest_token_${eventId} for guest participants on event-scoped requests.
 */
import { ApiError } from '@/lib/apiError';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.flowkyn.com/v1';

export type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  /** For event-scoped endpoints: use guest_token_${eventId} when no access_token (guests) */
  eventId?: string;
};

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(eventId?: string): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    let token = localStorage.getItem('access_token');
    if (!token && eventId) {
      token = localStorage.getItem(`guest_token_${eventId}`) || localStorage.getItem('guest_token');
    }
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
    const { params, eventId, ...fetchOptions } = options;
    const res = await fetch(this.buildUrl(path, params), {
      ...fetchOptions,
      headers: { ...this.getHeaders(eventId), ...(fetchOptions.headers as HeadersInit) },
    });

    if (res.status === 401) {
      const usedAccessToken = !!localStorage.getItem('access_token');
      const refreshed = usedAccessToken ? await this.refreshToken() : false;
      if (refreshed) return this.request<T>(path, options);
      // Only redirect to login when we had an expired JWT; guests should not be redirected
      if (usedAccessToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
      throw new ApiError({
        error: 'Unauthorized',
        code: 'AUTH_TOKEN_INVALID',
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

  get<T>(path: string, params?: Record<string, string>, eventId?: string) {
    return this.request<T>(path, { method: 'GET', params, eventId } as RequestOptions);
  }

  post<T>(path: string, body?: unknown, eventId?: string) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body), eventId } as RequestOptions);
  }

  patch<T>(path: string, body?: unknown, eventId?: string) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body), eventId } as RequestOptions);
  }

  put<T>(path: string, body?: unknown, eventId?: string) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body), eventId } as RequestOptions);
  }

  del<T>(path: string, eventId?: string) {
    return this.request<T>(path, { method: 'DELETE', eventId } as RequestOptions);
  }
}

export const api = new ApiClient(API_BASE);
