/**
 * @fileoverview Domain-based application mode detection and URL helpers.
 *
 * Production domain mapping:
 * - flowkyn.com / www.flowkyn.com → 'landing' (marketing site)
 * - app.flowkyn.com              → 'app' (user-facing application)
 * - admin.flowkyn.com            → 'admin' (internal admin panel)
 * - tests.flowkyn.com            → 'tests' (API test runner)
 *
 * Dev/preview: use ?app=landing|app|admin|tests to switch modes.
 *
 * SECURITY: Each mode serves ONLY its own routes.
 * - Landing: landing page + static pages (about, contact, privacy, terms, security)
 * - App: auth pages (login, register, forgot-password, etc.) + dashboard + all user features
 * - Admin: admin login + admin dashboard (super-admin only)
 * - Tests: API test runner UI
 */

export type AppMode = 'landing' | 'app' | 'admin' | 'tests' | 'templates';

export function detectAppMode(): AppMode {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Dev/preview: allow switching via ?app=landing|app|admin|tests
  const override = searchParams.get('app') as AppMode | null;
  if (override && ['landing', 'app', 'admin', 'tests', 'templates'].includes(override)) {
    return override;
  }

  // Auto-detect tests mode from path on dev/preview domains
  if (isDevMode() && (pathname.startsWith('/ui-tests') || pathname.startsWith('/uitests'))) {
    return 'tests';
  }

  // Production domain detection
  if (hostname.startsWith('tests.')) return 'tests';
  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('app.')) return 'app';

  // Root domain = landing, localhost defaults to landing
  return 'landing';
}

/** Check if we're in development/preview mode */
export function isDevMode(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname.includes('lovable.app') || hostname.includes('lovableproject.com') || hostname.includes('127.0.0.1');
}

// ─── Cross-Domain URL Helpers ────────────────────────────────────────────────

/**
 * Get the base production domain from environment or fallback to flowkyn.com.
 * Can be overridden via VITE_PROD_BASE environment variable.
 */
const PROD_BASE = import.meta.env.VITE_PROD_BASE || 'flowkyn.com';

/**
 * Get the absolute URL for the app subdomain (app.flowkyn.com).
 * In dev mode, returns a relative path with ?app=app override.
 */
export function getAppUrl(path: string = '/'): string {
  if (isDevMode()) return `${path}${path.includes('?') ? '&' : '?'}app=app`;
  return `https://app.${PROD_BASE}${path}`;
}

/**
 * Get the absolute URL for the admin subdomain (admin.flowkyn.com).
 * In dev mode, returns a relative path with ?app=admin override.
 */
export function getAdminUrl(path: string = '/'): string {
  if (isDevMode()) return `${path}${path.includes('?') ? '&' : '?'}app=admin`;
  return `https://admin.${PROD_BASE}${path}`;
}

/**
 * Get the absolute URL for the landing domain (flowkyn.com).
 * In dev mode, returns a relative path with ?app=landing override.
 */
export function getLandingUrl(path: string = '/'): string {
  if (isDevMode()) return `${path}${path.includes('?') ? '&' : '?'}app=landing`;
  return `https://${PROD_BASE}${path}`;
}
