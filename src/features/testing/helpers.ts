/**
 * @fileoverview Core utilities for the Flowkyn API test runner.
 *
 * Provides:
 * - `apiCall()` — Fetch wrapper with auto cURL generation, request tracking, and response header capture
 * - `Assertions` — Fluent assertion builder for granular test checks
 * - `testWebSocket()` — Socket.io polling transport handshake test
 * - `exportAsJSON()` / `exportAsCSV()` — Download test results
 * - Request collection helpers for auto-attaching requests to results
 * - `buildDiagnostics()` — Auto-generate diagnostic metadata for every test result
 */

import type { TestCase, TestContext, TestResult, TestState, RequestInfo } from './types';

// ─── Skip Helper ─────────────────────────────────────────────────────────────

/**
 * Return a standardized skipped result.
 * Use this instead of faking `status: 'passed'` when a prerequisite is missing.
 */
export function skipResult(reason: string): TestResult {
  return {
    status: 'skipped',
    duration: 0,
    response: { _note: `⏭ ${reason}` },
    assertions: [`⏭ ${reason}`],
    skipReason: reason,
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Base URL for versioned API endpoints (e.g., /users, /events) */
export const API_BASE = 'https://api.flowkyn.com/v1';

/** Root URL for non-versioned endpoints (e.g., /health, /docs) */
export const API_ROOT = 'https://api.flowkyn.com';

/** WebSocket base URL for Socket.io connections */
export const WS_BASE = 'https://api.flowkyn.com';

// ─── Test Registration ──────────────────────────────────────────────────────

/**
 * Register a test case into a suite array.
 * Generates a unique ID from `${category}::${name}`.
 */
export function defineTest(
  tests: TestCase[],
  category: string,
  name: string,
  method: string,
  endpoint: string,
  requiresAuth: boolean,
  run: TestCase['run']
) {
  tests.push({
    id: `${category}::${name}`,
    name,
    method,
    endpoint,
    requiresAuth,
    category,
    run,
  });
}

// ─── cURL Builder ────────────────────────────────────────────────────────────

/**
 * Build a reproducible cURL command string from request details.
 * Authorization tokens are masked as `<token>` for safe sharing.
 */
function buildCurl(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown,
  isFormData?: boolean
): string {
  const parts = [`curl -X ${method}`];

  for (const [k, v] of Object.entries(headers)) {
    const val = k === 'Authorization' ? 'Bearer <token>' : v;
    parts.push(`  -H '${k}: ${val}'`);
  }

  if (body && !isFormData) {
    parts.push(`  -d '${JSON.stringify(body)}'`);
  } else if (isFormData) {
    parts.push(`  -F 'file=@<file>'`);
  }

  parts.push(`  '${url}'`);
  return parts.join(' \\\n');
}

// ─── Request Collection ──────────────────────────────────────────────────────

let _currentRequests: RequestInfo[] = [];

/** Reset the request collector (call before each test) */
export function startRequestCollection() {
  _currentRequests = [];
}

/** Get a snapshot of all requests collected since last reset */
export function getCollectedRequests(): RequestInfo[] {
  return [..._currentRequests];
}

/** Internal: track a request in the collector */
function trackRequest(info: RequestInfo) {
  _currentRequests.push(info);
}

// ─── Response Header Extraction ──────────────────────────────────────────────

/**
 * Extract readable response headers from a fetch Response.
 * Browsers restrict some headers, so we capture what's available.
 */
function extractResponseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// ─── API Call ────────────────────────────────────────────────────────────────

/**
 * Make an HTTP request to the API and return structured results.
 *
 * Features:
 * - Auto-generates a cURL command for each request
 * - Tracks requests in the global collector
 * - Captures response headers for diagnostics
 * - Determines `ok` based on expected status codes
 * - Safely parses JSON response bodies
 */
export async function apiCall(
  baseUrl: string,
  method: string,
  path: string,
  opts: {
    token?: string | null;
    body?: unknown;
    expectStatus?: number;
    formData?: FormData;
  } = {}
): Promise<{
  ok: boolean;
  status: number;
  data: any;
  duration: number;
  headers: Headers;
  responseHeaders: Record<string, string>;
  requestInfo: RequestInfo;
}> {
  const start = performance.now();
  const headers: Record<string, string> = {};

  // Only set Content-Type when there's a body — avoids unnecessary CORS preflight
  if (!opts.formData && opts.body) headers['Content-Type'] = 'application/json';
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const url = `${baseUrl}${path}`;
  const curl = buildCurl(method, url, headers, opts.body, !!opts.formData);
  const requestInfo: RequestInfo = { method, url, headers: { ...headers }, body: opts.body, curl };
  trackRequest(requestInfo);

  try {
    // Build fetch options — only include headers/body when actually needed
    // This matches the exact pattern of simple CORS requests that work
    const fetchInit: RequestInit = { method, mode: 'cors' };

    // Only attach headers if we have any (empty headers can trigger unexpected behavior)
    const headerKeys = Object.keys(headers);
    if (headerKeys.length > 0) {
      fetchInit.headers = headers;
    }

    // Only attach body for methods that support it and when body exists
    if (opts.formData) {
      fetchInit.body = opts.formData;
    } else if (opts.body !== undefined && opts.body !== null) {
      fetchInit.body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, fetchInit);

    const duration = Math.round(performance.now() - start);
    const responseHeaders = extractResponseHeaders(res.headers);
    let data: any = null;
    try { data = await res.json(); } catch { /* empty body */ }

    const expectedStatus = opts.expectStatus || (method === 'POST' ? 201 : 200);
    const ok = res.status === expectedStatus || (res.ok && !opts.expectStatus);

    return { ok, status: res.status, data, duration, headers: res.headers, responseHeaders, requestInfo };
  } catch (err: any) {
    const duration = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      data: { error: err.message, _networkError: true, _hint: 'Check CORS config on backend or redeploy backend with latest cors.ts changes' },
      duration,
      headers: new Headers(),
      responseHeaders: {},
      requestInfo,
    };
  }
}

// ─── Diagnostics Builder ─────────────────────────────────────────────────────

/**
 * Build a diagnostics object that gets attached to every test result.
 * Provides maximum debugging context on both success and failure.
 */
export function buildDiagnostics(
  testName: string,
  r: Awaited<ReturnType<typeof apiCall>>,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const diag: Record<string, unknown> = {
    _test: testName,
    _timestamp: new Date().toISOString(),
    _latency: `${r.duration}ms`,
    _httpStatus: r.status,
    _requestUrl: r.requestInfo.url,
    _requestMethod: r.requestInfo.method,
  };

  // Response headers (what the browser exposes)
  if (Object.keys(r.responseHeaders).length > 0) {
    diag._responseHeaders = r.responseHeaders;
  }

  // Backend error details
  if (r.data?.code) diag._errorCode = r.data.code;
  if (r.data?.requestId) diag._requestId = r.data.requestId;
  if (r.data?.details && Array.isArray(r.data.details)) {
    diag._validationErrors = r.data.details;
  }

  // Network error flag
  if (r.status === 0) {
    diag._networkError = true;
    diag._hint = 'Server unreachable or CORS blocked. Check: 1) Server running, 2) CORS allows this origin, 3) No firewall/proxy blocking';
  }

  // Server error flag
  if (r.status >= 500) {
    diag._serverError = true;
    diag._hint = `Server returned ${r.status}. Check server logs with requestId: ${r.data?.requestId || 'unknown'}`;
  }

  // Merge extra data
  if (extra) Object.assign(diag, extra);

  return diag;
}

// ─── Assertion Builder ───────────────────────────────────────────────────────

/**
 * Fluent assertion builder for test checks.
 *
 * Usage:
 * ```ts
 * const a = new Assertions();
 * a.check('Status 200', r.status === 200)
 *  .check('Has id', !!r.data?.id);
 * return { status: a.passed ? 'passed' : 'failed', assertions: a.assertions };
 * ```
 */
export class Assertions {
  private checks: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Add an assertion check.
   * @param label - Human-readable description of what's being checked
   * @param condition - Boolean result of the check
   * @returns `this` for chaining
   */
  check(label: string, condition: boolean) {
    if (condition) {
      this.checks.push(`✓ ${label}`);
    } else {
      this.checks.push(`✗ ${label}`);
      this.errors.push(label);
    }
    return this;
  }

  /**
   * Add a warning (non-blocking) — shows up in assertions but doesn't fail the test.
   */
  warn(label: string, condition: boolean) {
    if (condition) {
      this.checks.push(`✓ ${label}`);
    } else {
      this.checks.push(`⚠ ${label}`);
      this.warnings.push(label);
    }
    return this;
  }

  /**
   * Add an info line (always shown, never fails).
   */
  info(label: string) {
    this.checks.push(`ℹ ${label}`);
    return this;
  }

  /** Whether all checks passed */
  get passed() { return this.errors.length === 0; }

  /** Array of all check results (✓/✗/⚠/ℹ prefixed) */
  get assertions() { return this.checks; }

  /** Whether there are any warnings */
  get hasWarnings() { return this.warnings.length > 0; }

  /** Summary of failed checks, or undefined if all passed */
  get errorSummary() {
    const parts: string[] = [];
    if (this.errors.length) parts.push(`Failed: ${this.errors.join('; ')}`);
    if (this.warnings.length) parts.push(`Warnings: ${this.warnings.join('; ')}`);
    return parts.length ? parts.join(' | ') : undefined;
  }
}

// ─── WebSocket Testing ───────────────────────────────────────────────────────

/**
 * Test a Socket.io connection via the HTTP long-polling transport.
 */
export async function testWebSocket(
  url: string,
  namespace: string,
  token: string | null,
  timeout = 5000
): Promise<{ ok: boolean; duration: number; data: any }> {
  const start = performance.now();

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        ok: false,
        duration: Math.round(performance.now() - start),
        data: { error: `Connection timed out after ${timeout}ms` },
      });
    }, timeout);

    try {
      const wsUrl = `${url}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`;
      const fullUrl = namespace !== '/' ? `${wsUrl}&nsp=${namespace}` : wsUrl;

      fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(async (res) => {
          clearTimeout(timer);
          const duration = Math.round(performance.now() - start);
          let data: any;
          try { data = await res.text(); } catch { data = null; }
          resolve({
            ok: res.ok || res.status === 400,
            duration,
            data: { status: res.status, response: data?.substring(0, 200) },
          });
        })
        .catch((err) => {
          clearTimeout(timer);
          resolve({
            ok: false,
            duration: Math.round(performance.now() - start),
            data: { error: err.message },
          });
        });
    } catch (err: any) {
      clearTimeout(timer);
      resolve({
        ok: false,
        duration: Math.round(performance.now() - start),
        data: { error: err.message },
      });
    }
  });
}

// ─── Export Functions ─────────────────────────────────────────────────────────

/**
 * Export test results as a structured JSON report with full diagnostics.
 */
export function exportAsJSON(tests: TestCase[], states: Record<string, TestState>) {
  const results = tests.map((t) => ({
    id: t.id,
    category: t.category,
    name: t.name,
    method: t.method,
    endpoint: t.endpoint,
    status: states[t.id]?.status || 'idle',
    statusCode: states[t.id]?.result?.statusCode,
    duration: states[t.id]?.result?.duration,
    error: states[t.id]?.result?.error,
    assertions: states[t.id]?.result?.assertions,
    requests: states[t.id]?.result?.requests,
    response: states[t.id]?.result?.response,
    diagnostics: states[t.id]?.result?.diagnostics,
    responseHeaders: states[t.id]?.result?.responseHeaders,
  }));

  const failedTests = results.filter(r => r.status === 'failed');

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: API_BASE,
    environment: {
      userAgent: navigator.userAgent,
      origin: window.location.origin,
      apiBase: API_BASE,
    },
    summary: {
      total: tests.length,
      passed: results.filter((r) => r.status === 'passed').length,
      failed: failedTests.length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
    },
    // Quick-access failure summary at the top
    ...(failedTests.length > 0 ? {
      failureSummary: failedTests.map(f => ({
        test: f.id,
        statusCode: f.statusCode,
        error: f.error,
        requestId: (f.response as any)?.requestId || (f.diagnostics as any)?._requestId,
      })),
    } : {}),
    results,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `flowkyn-api-tests-${Date.now()}.json`);
}

/**
 * Export test results as a CSV spreadsheet.
 */
export function exportAsCSV(tests: TestCase[], states: Record<string, TestState>) {
  const headers = ['Category', 'Name', 'Method', 'Endpoint', 'Status', 'Status Code', 'Duration (ms)', 'Error', 'Request ID'];
  const rows = tests.map((t) => {
    const s = states[t.id];
    const requestId = (s?.result?.response as any)?.requestId || (s?.result?.diagnostics as any)?._requestId || '';
    return [
      t.category,
      t.name,
      t.method,
      t.endpoint,
      s?.status || 'idle',
      s?.result?.statusCode ?? '',
      s?.result?.duration ?? '',
      s?.result?.error ? `"${s.result.error.replace(/"/g, '""')}"` : '',
      requestId,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `flowkyn-api-tests-${Date.now()}.csv`);
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/** Trigger a browser file download from a Blob */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
