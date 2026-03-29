/**
 * @fileoverview Notification Tests
 * @dependencies Requires `ctx.token` from Auth suite
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function notificationsTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Notifications', 'List notifications (shape)', 'GET', '/notifications', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/notifications?page=1&limit=10', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has data array', Array.isArray(r.data?.data))
     .check('Has pagination.total', typeof r.data?.pagination?.total === 'number')
     .check('Has pagination.page', r.data?.pagination?.page === 1);
    if (r.data?.data?.length > 0) {
      ctx.createdIds.notificationId = r.data.data[0].id;
      a.check('Notification has id', !!r.data.data[0].id)
       .check('Has type/event_type', !!r.data.data[0].type || !!r.data.data[0].event_type)
       .check('Has created_at', !!r.data.data[0].created_at);
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Notifications', 'List page 2 (pagination)', 'GET', '/notifications?page=2', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/notifications?page=2&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('page === 2', r.data?.pagination?.page === 2);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Notifications', 'Mark as read', 'PATCH', '/notifications/:id', true, async (ctx) => {
    if (!ctx.createdIds.notificationId) {
      // No notifications exist — verify endpoint rejects a non-existent UUID
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const r = await apiCall(ctx.baseUrl, 'PATCH', `/notifications/${fakeId}`, { token: ctx.token });
      const a = new Assertions();
      a.check('Rejects non-existent notification (400/404)', [400, 404].includes(r.status));
      a.info('No notifications in inbox — tested with non-existent UUID');
      return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
    }
    const r = await apiCall(ctx.baseUrl, 'PATCH', `/notifications/${ctx.createdIds.notificationId}`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Notifications', 'Mark (invalid ID → error)', 'PATCH', '/notifications/not-a-uuid', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'PATCH', '/notifications/not-a-uuid', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns error', [400, 404, 500].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
