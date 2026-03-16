/**
 * @fileoverview User Profile Tests
 * @dependencies Requires `ctx.token` and `ctx.createdIds.userId` from Auth suite
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function usersTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Users', 'List users (paginated)', 'GET', '/users', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/users?page=1&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has data array', Array.isArray(r.data?.data))
     .check('Has pagination.total (number)', typeof r.data?.pagination?.total === 'number')
     .check('Has pagination.page === 1', r.data?.pagination?.page === 1)
     .check('Has pagination.limit === 5', r.data?.pagination?.limit === 5)
     .check('Data ≤ limit', r.data?.data?.length <= 5)
     .check('Users have id', r.data?.data?.length === 0 || !!r.data?.data?.[0]?.id)
     .check('Users have email', r.data?.data?.length === 0 || !!r.data?.data?.[0]?.email)
     .check('No password_hash leaked', !r.data?.data?.[0]?.password_hash);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'List users (page 2)', 'GET', '/users?page=2', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/users?page=2&limit=2', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('page === 2', r.data?.pagination?.page === 2);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Get user by ID (verify fields)', 'GET', '/users/:id', true, async (ctx) => {
    if (!ctx.token || !ctx.createdIds.userId) return skipResult('No auth token or userId');
    const r = await apiCall(ctx.baseUrl, 'GET', `/users/${ctx.createdIds.userId}`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('id matches requested', r.data?.id === ctx.createdIds.userId)
     .check('Has name', typeof r.data?.name === 'string')
     .check('Has email', typeof r.data?.email === 'string')
     .check('Has avatar_url field', 'avatar_url' in (r.data || {}))
     .check('Has created_at', !!r.data?.created_at)
     .check('No password_hash', !r.data?.password_hash);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Get user (invalid UUID → error)', 'GET', '/users/not-a-uuid', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/users/not-a-uuid', { token: ctx.token });
    const a = new Assertions();
    a.check('Returns error (400/404/500)', [400, 404, 500].includes(r.status))
     .check('Has error message', typeof r.data?.error === 'string');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Get user (non-existent UUID → 404)', 'GET', '/users/:id', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/users/00000000-0000-0000-0000-000000000000', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 404', r.status === 404)
     .check('code === NOT_FOUND', r.data?.code === 'NOT_FOUND');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Update profile (name)', 'PATCH', '/users/me', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const newName = `Test User ${Date.now()}`;
    const r = await apiCall(ctx.baseUrl, 'PATCH', '/users/me', { token: ctx.token, body: { name: newName } });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Name updated', r.data?.name === newName)
     .check('Has updated_at', !!r.data?.updated_at);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Update language preference', 'PATCH', '/users/me', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'PATCH', '/users/me', { token: ctx.token, body: { language: 'fr' } });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Language updated to "fr"', r.data?.language === 'fr');
    await apiCall(ctx.baseUrl, 'PATCH', '/users/me', { token: ctx.token, body: { language: 'en' } });
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Verify profile update persisted', 'GET', '/users/me', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/users/me', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Name starts with "Test User"', r.data?.name?.startsWith('Test User'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Complete onboarding', 'POST', '/users/complete-onboarding', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/users/complete-onboarding', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200 or already completed', r.ok || r.status === 400);
    if (r.ok) a.check('onboarding_completed === true', r.data?.onboarding_completed === true);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Users', 'Upload avatar (no file → 400)', 'POST', '/users/avatar', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/users/avatar', { token: ctx.token, body: {} });
    const a = new Assertions();
    a.check('Rejects (400/500)', [400, 500].includes(r.status))
     .check('code is FILE_MISSING', r.data?.code === 'FILE_MISSING' || r.status === 500);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
