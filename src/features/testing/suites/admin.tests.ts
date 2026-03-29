/**
 * @fileoverview Admin Panel Tests
 * @dependencies Requires `ctx.token` from Auth suite
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function adminTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Admin', 'Admin stats (role check)', 'GET', '/admin/stats', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/admin/stats', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 (admin) or 403 (non-admin)', [200, 403].includes(r.status));
    if (r.status === 403) a.check('Proper error code', ['FORBIDDEN', 'INSUFFICIENT_PERMISSIONS', 'SUPER_ADMIN_REQUIRED'].includes(r.data?.code));
    if (r.status === 200) a.check('Has stats data', typeof r.data === 'object');
    return {
      status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status,
      response: { ...r.data, _note: r.status === 403 ? 'Correctly rejected — not admin' : 'Has admin access' },
      assertions: a.assertions, error: a.errorSummary,
    };
  });

  defineTest(tests, 'Admin', 'Admin users list', 'GET', '/admin/users', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/admin/users?page=1&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 or 403', [200, 403].includes(r.status));
    if (r.status === 200) {
      a.check('Has data array', Array.isArray(r.data?.data))
       .check('Has pagination', typeof r.data?.pagination === 'object');
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Admin', 'Admin organizations list', 'GET', '/admin/organizations', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/admin/organizations?page=1&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 or 403', [200, 403].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Admin', 'Admin game sessions', 'GET', '/admin/game-sessions', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/admin/game-sessions?page=1&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 or 403', [200, 403].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Admin', 'Admin audit logs', 'GET', '/admin/audit-logs', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/admin/audit-logs?page=1&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 or 403', [200, 403].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Admin', 'Admin contacts list', 'GET', '/admin/contact', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/admin/contact?page=1&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 or 403', [200, 403].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Admin', 'Admin without token → 401', 'GET', '/admin/stats', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'GET', '/admin/stats', { expectStatus: 401 });
    const a = new Assertions();
    a.check('Status 401', r.status === 401)
     .check('code === AUTH_MISSING_TOKEN', r.data?.code === 'AUTH_MISSING_TOKEN');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
