/**
 * App API client with shared refresh promise to prevent concurrent refresh race conditions.
 * Uses localStorage: access_token, refresh_token for logged-in users;
 * guest_token_${eventId} (with cookie backup) for guest participants on event-scoped requests.
 */
import { ApiError } from '@/lib/apiError';
import { getGuestToken } from '@/lib/guestTokenPersistence';

// Hard-coded API base URL to ensure consistent production behavior
const API_BASE = 'https://api.flowkyn.com/v1';

export type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  /** For event-scoped endpoints: use guest_token_${eventId} when no access_token (guests) */
  eventId?: string;
  /** Optional override: force a specific auth token (e.g. guest token even if access_token exists) */
  authToken?: string;
};

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(eventId?: string, authToken?: string): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    let token = authToken || localStorage.getItem('access_token');
    if (!token && eventId) {
      token = getGuestToken(eventId) || localStorage.getItem('guest_token');
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
    const { params, eventId, authToken, ...fetchOptions } = options;
    const method = fetchOptions.method || 'GET';
    const startTime = performance.now();
    const fullUrl = this.buildUrl(path, params);

    // Log request start
    console.log(`[ApiClient] 📤 ${method} ${path}`, {
      url: fullUrl,
      params,
      eventId,
      hasAuthToken: !!authToken || !!localStorage.getItem('access_token'),
      hasAccessToken: !!localStorage.getItem('access_token'),
    });

    const res = await fetch(fullUrl, {
      ...fetchOptions,
      headers: { ...this.getHeaders(eventId, authToken), ...(fetchOptions.headers as HeadersInit) },
    });

    const duration = performance.now() - startTime;
    console.log(`[ApiClient] 📥 ${method} ${path} - Status ${res.status} (${duration.toFixed(0)}ms)`, {
      status: res.status,
      statusText: res.statusText,
      duration,
    });

    if (res.status === 401) {
      console.warn(`[ApiClient] ⚠️ 401 Unauthorized for ${path}`, {
        usedAccessToken: !!localStorage.getItem('access_token'),
      });

      const usedAccessToken = !!localStorage.getItem('access_token');
      const refreshed = usedAccessToken ? await this.refreshToken() : false;
      if (refreshed) {
        console.log(`[ApiClient] 🔄 Token refreshed, retrying ${path}`);
        return this.request<T>(path, options);
      }
      // Only redirect to login when we had an expired JWT; guests should not be redirected
      if (usedAccessToken) {
        console.error(`[ApiClient] ❌ Token refresh failed, redirecting to login`);
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
      
      // Log detailed error information for debugging
      console.error(`[ApiClient] ❌ HTTP Error ${res.status}:`, {
        path,
        method,
        status: res.status,
        error: body.error,
        code: body.code,
        details: body.details,
        url: fullUrl,
        duration: `${duration.toFixed(0)}ms`,
      });
      
      throw new ApiError({
        error: body.error || `HTTP ${res.status}`,
        code: body.code || 'INTERNAL_ERROR',
        statusCode: body.statusCode || res.status,
        requestId: body.requestId || 'unknown',
        details: body.details,
        timestamp: body.timestamp || new Date().toISOString(),
      });
    }

    if (res.status === 204) {
      console.log(`[ApiClient] ✅ ${method} ${path} - No content`, { duration: `${duration.toFixed(0)}ms` });
      return undefined as T;
    }

    const data = await res.json();
    console.log(`[ApiClient] ✅ ${method} ${path} - Success`, {
      status: res.status,
      dataKeys: Array.isArray(data) ? `[${data.length} items]` : typeof data === 'object' ? Object.keys(data || {}) : typeof data,
      duration: `${duration.toFixed(0)}ms`,
    });
    return data;
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

  upload<T>(path: string, formData: FormData, eventId?: string): Promise<T> {
    // For file uploads, we need to send FormData without Content-Type header
    // (the browser will set it with the correct boundary)
    return this.uploadRequest<T>(path, formData, eventId);
  }

  private async uploadRequest<T>(path: string, formData: FormData, eventId?: string): Promise<T> {
    const headers: HeadersInit = {};
    let token = localStorage.getItem('access_token');
    if (!token && eventId) {
      token = getGuestToken(eventId) || localStorage.getItem('guest_token');
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.status === 401) {
      const usedAccessToken = !!localStorage.getItem('access_token');
      const refreshed = usedAccessToken ? await this.refreshToken() : false;
      if (refreshed) return this.uploadRequest<T>(path, formData, eventId);
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
}

export const api = new ApiClient(API_BASE);
