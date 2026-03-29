/**
 * @fileoverview Cleanup / Teardown Tests
 * @dependencies Requires `ctx.createdIds.eventId`, `ctx.createdIds.orgId`
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function cleanupTests(): TestCase[] {
  const tests: TestCase[] = [];

  // Store the eventId before it gets cleared, so we can verify deletion
  let deletedEventId = '';

  defineTest(tests, 'Cleanup', 'Leave event before delete', 'POST', '/events/:id/leave', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — nothing to leave');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/leave`, { token: ctx.token });
    const a = new Assertions();
    a.check('Left or already left', r.ok || r.status === 400 || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Cleanup', 'Delete test event', 'DELETE', '/events/:id', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — nothing to delete');
    deletedEventId = ctx.createdIds.eventId;
    const r = await apiCall(ctx.baseUrl, 'DELETE', `/events/${ctx.createdIds.eventId}`, { token: ctx.token, expectStatus: 200 });
    const a = new Assertions();
    a.check('Deleted (200/204/404)', r.ok || r.status === 204 || r.status === 404);
    if (r.ok || r.status === 204) ctx.createdIds.eventId = '';
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Cleanup', 'Verify event deleted', 'GET', '/events/:id', true, async (ctx) => {
    const idToCheck = deletedEventId || ctx.createdIds.eventId;
    if (!idToCheck) return skipResult('No eventId to verify');
    const r = await apiCall(ctx.baseUrl, 'GET', `/events/${idToCheck}`, { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 404 (deleted)', r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Cleanup', 'Delete test organization', 'DELETE', '/organizations/:id', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — nothing to delete');
    const r = await apiCall(ctx.baseUrl, 'DELETE', `/organizations/${ctx.createdIds.orgId}`, { token: ctx.token, expectStatus: 200 });
    const a = new Assertions();
    a.check('Deleted (200/204/404)', r.ok || r.status === 204 || r.status === 404);
    if (r.ok || r.status === 204) ctx.createdIds.orgId = '';
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
