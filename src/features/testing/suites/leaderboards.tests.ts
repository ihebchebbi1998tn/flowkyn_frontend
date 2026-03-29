/**
 * @fileoverview Leaderboard Tests
 * @dependencies Requires `ctx.token` from Auth suite
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function leaderboardsTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Leaderboards', 'Get leaderboard (non-existent UUID)', 'GET', '/leaderboards/:id', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/leaderboards/00000000-0000-0000-0000-000000000000', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 (empty) or 404', r.ok || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Leaderboards', 'Get entries (non-existent UUID)', 'GET', '/leaderboards/:id/entries', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/leaderboards/00000000-0000-0000-0000-000000000000/entries', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 200 (empty) or 404', r.ok || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Leaderboards', 'Get leaderboard (invalid ID → error)', 'GET', '/leaderboards/bad-id', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/leaderboards/bad-id', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns error', [400, 404, 500].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
