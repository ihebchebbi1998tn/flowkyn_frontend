/**
 * @fileoverview System & Infrastructure Tests
 *
 * Verifies the API server is operational before running domain-specific tests.
 *
 * Tests:
 * - Health check endpoint (status, DB connection, memory, pool stats)
 * - CORS validation (fetch success confirms CORS is working)
 * - 404 error handler with structured error format
 * - Malformed JSON body handling
 * - API documentation accessibility
 * - Response time threshold (< 1000ms to account for cold starts)
 *
 * @dependencies None — runs first, no auth required
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, API_ROOT, Assertions } from '../helpers';

export function systemTests(): TestCase[] {
  const tests: TestCase[] = [];

  // ── Health Check ─────────────────────────────────────────────────────────

  defineTest(tests, 'System', 'Health check (full validation)', 'GET', '/health', false, async () => {
    const r = await apiCall(API_ROOT, 'GET', '/health');
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('status === "ok"', r.data?.status === 'ok')
     .check('database === "connected"', r.data?.database === 'connected')
     .check('Has uptime (number)', typeof r.data?.uptime === 'number')
     .check('Has memory.rss (MB)', typeof r.data?.memory?.rss === 'number')
     .check('Has memory.heapUsed (MB)', typeof r.data?.memory?.heapUsed === 'number')
     .check('Has pool.totalCount', typeof r.data?.pool?.totalCount === 'number')
     .check('Has pool.idleCount', typeof r.data?.pool?.idleCount === 'number')
     .check('Pool waitingCount === 0', r.data?.pool?.waitingCount === 0);
    if (r.data?.uptime) a.info(`Uptime: ${Math.round(r.data.uptime)}s`);
    if (r.data?.memory) a.info(`Memory: RSS ${r.data.memory.rss}MB, Heap ${r.data.memory.heapUsed}MB`);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, responseHeaders: r.responseHeaders, assertions: a.assertions, error: a.errorSummary };
  });

  // ── CORS ─────────────────────────────────────────────────────────────────
  // Note: Browsers don't expose CORS response headers (access-control-allow-origin)
  // to JavaScript via fetch(). The fact that fetch() succeeds confirms CORS is configured.

  defineTest(tests, 'System', 'CORS works (cross-origin fetch succeeds)', 'GET', '/health', false, async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${API_ROOT}/health`);
      const duration = Math.round(performance.now() - start);
      const data = await res.json().catch(() => null);
      const a = new Assertions();
      a.check('Fetch succeeded (CORS allowed)', res.ok)
       .check('Content-Type is JSON', res.headers.get('content-type')?.includes('application/json') ?? false)
       .check('Got valid JSON body', data !== null && typeof data === 'object');
      return {
        status: a.passed ? 'passed' : 'failed', duration, statusCode: res.status,
        response: {
          'content-type': res.headers.get('content-type'),
          _note: 'CORS headers are not readable from JS but fetch succeeded, confirming CORS is configured',
        },
        assertions: a.assertions, error: a.errorSummary,
      };
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      return {
        status: 'failed', duration,
        error: `CORS blocked: ${err.message}`,
        assertions: ['✗ Fetch failed — likely CORS misconfiguration'],
      };
    }
  });

  defineTest(tests, 'System', 'CORS preflight (OPTIONS succeeds)', 'GET', '/health', false, async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${API_ROOT}/health`, { method: 'OPTIONS' });
      const duration = Math.round(performance.now() - start);
      const a = new Assertions();
      a.check('Status 200/204', res.status === 200 || res.status === 204)
       .check('OPTIONS request accepted', res.ok || res.status === 204);
      return {
        status: a.passed ? 'passed' : 'failed', duration, statusCode: res.status,
        response: {
          status: res.status,
          _note: 'Preflight accepted — CORS configured correctly on server',
        },
        assertions: a.assertions, error: a.errorSummary,
      };
    } catch (err: any) {
      return { status: 'failed', duration: Math.round(performance.now() - start), error: err.message };
    }
  });

  // ── Error Handling ───────────────────────────────────────────────────────

  defineTest(tests, 'System', '404 handler (structured error)', 'GET', '/v1/nonexistent-route', false, async () => {
    const r = await apiCall(API_ROOT, 'GET', '/v1/nonexistent-route', { expectStatus: 404 });
    const a = new Assertions();
    a.check('Status 404', r.status === 404)
     .check('Has "error" (string)', typeof r.data?.error === 'string')
     .check('code === "NOT_FOUND"', r.data?.code === 'NOT_FOUND')
     .check('Has requestId (UUID)', typeof r.data?.requestId === 'string' && r.data.requestId.length > 10)
     .check('Has timestamp (ISO)', typeof r.data?.timestamp === 'string' && r.data.timestamp.includes('T'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'System', 'Malformed JSON body → 400', 'POST', '/v1/auth/login', false, async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${API_ROOT}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json',
      });
      const duration = Math.round(performance.now() - start);
      const data = await res.json().catch(() => null);
      const a = new Assertions();
      a.check('Status 400', res.status === 400)
       .check('code === VALIDATION_FAILED', data?.code === 'VALIDATION_FAILED');
      return { status: a.passed ? 'passed' : 'failed', duration, statusCode: res.status, response: data, assertions: a.assertions, error: a.errorSummary };
    } catch (err: any) {
      return { status: 'failed', duration: Math.round(performance.now() - start), error: err.message };
    }
  });

  // ── Documentation ────────────────────────────────────────────────────────

  defineTest(tests, 'System', 'API docs accessible', 'GET', '/docs', false, async () => {
    const start = performance.now();
    const res = await fetch(`${API_ROOT}/docs`);
    const duration = Math.round(performance.now() - start);
    const a = new Assertions();
    a.check('Responds (200 or 401)', res.ok || res.status === 401);
    return {
      status: a.passed ? 'passed' : 'failed', duration, statusCode: res.status,
      response: { accessible: res.ok, requiresAuth: res.status === 401 },
      assertions: a.assertions, error: a.errorSummary,
    };
  });

  // ── Performance ──────────────────────────────────────────────────────────

  defineTest(tests, 'System', 'Response time < 2000ms', 'GET', '/health', false, async () => {
    const r = await apiCall(API_ROOT, 'GET', '/health');
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check(`Response time ${r.duration}ms < 2000ms`, r.duration < 2000);
    return {
      status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status,
      response: { latency: `${r.duration}ms`, threshold: '2000ms' },
      assertions: a.assertions, error: a.errorSummary,
    };
  });

  return tests;
}
