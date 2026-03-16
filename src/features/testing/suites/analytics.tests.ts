/**
 * @fileoverview Analytics API Tests (Track + Dashboard + Overview + Active Sessions)
 * @dependencies Requires `ctx.token` from Auth suite
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function analyticsTests(): TestCase[] {
  const tests: TestCase[] = [];

  // ── POST /analytics (track) ────────────────────────────────────────────────

  defineTest(tests, 'Analytics', 'Track event', 'POST', '/analytics', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/analytics', {
      token: ctx.token,
      body: { event_name: 'ui_test_run', properties: { source: 'api-test-runner', timestamp: new Date().toISOString() } },
    });
    const a = new Assertions();
    a.check('Status 200/201', r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Analytics', 'Track (no body → 400)', 'POST', '/analytics', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/analytics', { token: ctx.token, body: {} });
    const a = new Assertions();
    a.check('Returns 400 or accepts empty', r.status === 400 || r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ── GET /analytics/dashboard ───────────────────────────────────────────────

  defineTest(tests, 'Analytics', 'Dashboard stats', 'GET', '/analytics/dashboard', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/analytics/dashboard', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200);
    a.check('Has activeSessions field', r.data && typeof r.data.activeSessions === 'number');
    a.check('Has teamMembers field', r.data && typeof r.data.teamMembers === 'number');
    a.check('Has totalEvents field', r.data && typeof r.data.totalEvents === 'number');
    a.check('Has completedSessions field', r.data && typeof r.data.completedSessions === 'number');
    a.check('Has upcomingEvents array', Array.isArray(r.data?.upcomingEvents));
    a.check('Has recentActivity array', Array.isArray(r.data?.recentActivity));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Analytics', 'Dashboard (no auth → 401)', 'GET', '/analytics/dashboard', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'GET', '/analytics/dashboard', {});
    const a = new Assertions();
    a.check('Status 401', r.status === 401);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ── GET /analytics/overview ────────────────────────────────────────────────

  defineTest(tests, 'Analytics', 'Overview (default 6 months)', 'GET', '/analytics/overview', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/analytics/overview', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200);
    a.check('Has engagementTrend array', Array.isArray(r.data?.engagementTrend));
    a.check('Has activityBreakdown array', Array.isArray(r.data?.activityBreakdown));
    a.check('Has topActivities array', Array.isArray(r.data?.topActivities));
    a.check('Has stats object', r.data?.stats && typeof r.data.stats === 'object');
    a.check('Stats has totalSessions', typeof r.data?.stats?.totalSessions === 'number');
    a.check('Stats has completionRate', typeof r.data?.stats?.completionRate === 'number');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Analytics', 'Overview (custom range)', 'GET', '/analytics/overview?months=3', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/analytics/overview?months=3', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200);
    a.check('Has stats', r.data?.stats && typeof r.data.stats === 'object');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Analytics', 'Overview (no auth → 401)', 'GET', '/analytics/overview', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'GET', '/analytics/overview', {});
    const a = new Assertions();
    a.check('Status 401', r.status === 401);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ── GET /analytics/active-sessions ─────────────────────────────────────────

  defineTest(tests, 'Analytics', 'Active sessions', 'GET', '/analytics/active-sessions', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/analytics/active-sessions', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200);
    a.check('Returns array', Array.isArray(r.data));
    if (Array.isArray(r.data) && r.data.length > 0) {
      const s = r.data[0];
      a.check('Session has id', typeof s.id === 'string');
      a.check('Session has game_type_name', typeof s.game_type_name === 'string');
      a.check('Session has status', typeof s.status === 'string');
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Analytics', 'Active sessions (no auth → 401)', 'GET', '/analytics/active-sessions', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'GET', '/analytics/active-sessions', {});
    const a = new Assertions();
    a.check('Status 401', r.status === 401);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
