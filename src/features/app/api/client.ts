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

  /** Extract eventId from an API path like /events/:eventId/... for guest token lookup */
  private extractEventIdFromPath(path: string): string | null {
    const match = path.match(/^\/events\/([a-zA-Z0-9-]+)(?:\/|$)/);
    return match?.[1] ?? null;
  }

  private getHeaders(isMultipart = false, requestPath?: string): HeadersInit {
    const headers: HeadersInit = {};
    if (!isMultipart) headers['Content-Type'] = 'application/json';
    // Prefer the real user JWT
    let token = localStorage.getItem('access_token') || localStorage.getItem('guest_token');
    
    if (!token) {
      // Prefer eventId from the request path (most accurate for event-scoped API calls)
      let eventId = requestPath ? this.extractEventIdFromPath(requestPath) : null;
      if (!eventId) {
        const match = window.location.pathname.match(/\/(join|play|lobby|events)\/([a-zA-Z0-9-]+)/);
        eventId = match?.[2] ?? null;
      }
      if (eventId) {
        token = localStorage.getItem(`guest_token_${eventId}`);
      }
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

  async request<T>(path: string, options: RequestOptions = {}, _retried = false): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    let res: Response;
    try {
      res = await fetch(url, {
        ...fetchOptions,
        headers: { ...this.getHeaders(false, path), ...fetchOptions.headers },
        credentials: 'include',
      });
    } catch (networkErr: any) {
      const msg = networkErr?.message?.toLowerCase?.() || '';
      const isCors = msg.includes('cors') || msg.includes('cross-origin');
      const isNetwork = msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed');
      const userMessage = isCors
        ? 'Unable to connect to the API. The server may not allow requests from this origin. Please try again or contact support.'
        : isNetwork
          ? 'Network error. Please check your connection and try again.'
          : 'The request could not be completed. Please try again.';
      throw new ApiError({
        error: userMessage,
        message: userMessage,
        code: 'SERVICE_UNAVAILABLE',
        statusCode: 0,
        requestId: 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
    if (res.status === 401 && !_retried) {
      // Auth endpoints (login, refresh, register) should never trigger a redirect —
      // they return 401 as a legitimate "wrong credentials / expired token" response.
      // Only attempt the refresh + redirect flow for protected API endpoints.
      const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/refresh') || path.includes('/auth/register');

      // Guest-friendly pages (/join, /play) are designed for unauthenticated users.
      // A 401 here just means "not logged in yet" — do NOT redirect to login.
      const guestFriendlyPaths = ['/join', '/play', '/invite'];
      const isGuestFriendlyPage = guestFriendlyPaths.some(p => window.location.pathname.startsWith(p));

      if (!isAuthEndpoint && !isGuestFriendlyPage) {
        // Only attempt one token refresh per request to prevent infinite loops.
        const refreshed = await this.refreshToken();
        if (refreshed) return this.request<T>(path, options, true);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
      throw new ApiError({
        error: 'Unauthorized',
        code: 'AUTH_INVALID_CREDENTIALS',
        statusCode: 401,
        requestId: 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({
        error: 'Request failed',
        message: 'Request failed',
        code: 'INTERNAL_ERROR' as const,
        statusCode: res.status,
        requestId: 'unknown',
        timestamp: new Date().toISOString(),
      }));
      const displayMsg = body.message ?? body.error ?? `Request failed (${res.status})`;
      throw new ApiError({
        error: body.error ?? displayMsg,
        message: displayMsg,
        code: body.code || 'INTERNAL_ERROR',
        statusCode: body.statusCode ?? res.status,
        requestId: body.requestId || 'unknown',
        details: body.details,
        timestamp: body.timestamp || new Date().toISOString(),
      });
    }
    if (res.status === 204) return undefined as T;
    
    const data = await res.json();
    return this.transformResponseUrls(data) as T;
  }

  /** Recursively rewrites localhost URLs from the backend to the current API domain */
  private transformResponseUrls(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      // If string is an absolute URL pointing to /uploads/..., rewrite its origin
      // so it matches the current API API_BASE (regardless of what host it was saved with).
      const match = obj.match(/^https?:\/\/[^\/]+(\/uploads\/.*)/);
      if (match) {
        const baseRoot = API_BASE.replace(/\/v1$/, '');
        return `${baseRoot}${match[1]}`;
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformResponseUrls(item));
    }
    if (typeof obj === 'object') {
      const newObj: any = {};
      for (const [k, v] of Object.entries(obj)) {
        newObj[k] = this.transformResponseUrls(v);
      }
      return newObj;
    }
    return obj;
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
      const headers = this.getHeaders(true, path) as Record<string, string>;
      let res: Response;
      try {
        res = await fetch(this.buildUrl(path), {
          method: 'POST',
          body: formData,
          headers,
          credentials: 'include',
        });
      } catch (networkErr: any) {
        const msg = networkErr?.message?.toLowerCase?.() || '';
        const isCors = msg.includes('cors') || msg.includes('cross-origin');
        const userMessage = isCors
          ? 'Unable to upload. The API may not allow requests from this origin. Please try again or contact support.'
          : 'Network error. Please check your connection and try again.';
        throw new ApiError({
          error: userMessage,
          message: userMessage,
          code: 'SERVICE_UNAVAILABLE',
          statusCode: 0,
          requestId: 'unknown',
          timestamp: new Date().toISOString(),
        });
      }

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
          message: 'Upload failed',
          code: 'INTERNAL_ERROR' as const,
          statusCode: res.status,
          requestId: 'unknown',
          timestamp: new Date().toISOString(),
        }));
        const displayMsg = body.message ?? body.error ?? `Upload failed (${res.status})`;
        throw new ApiError({
          error: body.error ?? displayMsg,
          message: displayMsg,
          code: body.code || 'INTERNAL_ERROR',
          statusCode: body.statusCode ?? res.status,
          requestId: body.requestId || 'unknown',
          details: body.details,
          timestamp: body.timestamp || new Date().toISOString(),
        });
      }
      if (res.status === 204) return undefined as T;
      const data = await res.json();
      return this.transformResponseUrls(data) as T;
    };
    return doUpload();
  }
}

export const api = new ApiClient(API_BASE);
