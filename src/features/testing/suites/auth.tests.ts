/**
 * @fileoverview Authentication & Authorization Tests
 *
 * @dependencies None — runs second after System tests
 * @sideEffects Sets `ctx.token`, `ctx.refreshToken`, `ctx.createdIds.userId`
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function authTests(): TestCase[] {
  const tests: TestCase[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // Registration Validation
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'Register (empty body → field errors)', 'POST', '/auth/register', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/register', { body: {}, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('code === VALIDATION_FAILED', r.data?.code === 'VALIDATION_FAILED')
     .check('Has details array', Array.isArray(r.data?.details))
     .check('Requires email', r.data?.details?.some((d: any) => d.field === 'email'))
     .check('Requires password', r.data?.details?.some((d: any) => d.field === 'password'))
     .check('Requires name', r.data?.details?.some((d: any) => d.field === 'name'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Register (weak password → details)', 'POST', '/auth/register', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/register', {
      body: { email: 'weak@test.com', password: 'short', name: 'Test' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Password too short', r.data?.details?.some((d: any) => d.message?.includes('8 char')))
     .check('Missing uppercase', r.data?.details?.some((d: any) => d.message?.includes('uppercase')))
     .check('Missing number', r.data?.details?.some((d: any) => d.message?.includes('number')));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Register (no uppercase → 400)', 'POST', '/auth/register', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/register', {
      body: { email: 'a@b.com', password: 'alllowercase1', name: 'Test' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Mentions uppercase', r.data?.details?.some((d: any) => d.message?.includes('uppercase')));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Register (invalid email format)', 'POST', '/auth/register', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/register', {
      body: { email: 'not-an-email', password: 'TestPass1', name: 'Test' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Email validation error', r.data?.details?.some((d: any) => d.field === 'email'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Register (name too long → 400)', 'POST', '/auth/register', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/register', {
      body: { email: 'a@b.com', password: 'TestPass1', name: 'X'.repeat(200) }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Conditional Signup (New Account Mode)
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'Register new test account', 'POST', '/auth/register', false, async (ctx) => {
    const mode = (document.getElementById('test-mode') as HTMLSelectElement)?.value;
    if (mode !== 'signup') {
      return skipResult('Using existing account mode');
    }

    const email = (document.getElementById('test-email') as HTMLInputElement)?.value;
    const password = (document.getElementById('test-password') as HTMLInputElement)?.value;
    const name = (document.getElementById('test-name') as HTMLInputElement)?.value || 'Test User';

    if (!email || !password) {
      return { status: 'failed', duration: 0, error: 'Credentials empty', assertions: ['✗ No credentials'] };
    }

    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/register', { body: { email, password, name, lang: 'en' } });
    const a = new Assertions();
    a.check('Status 201 or 409', r.status === 201 || r.status === 409);
    if (r.status === 201) a.check('Has success message', typeof r.data?.message === 'string');
    if (r.ok || r.status === 409) ctx.createdIds._signupDone = 'true';
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Login Validation
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'Login (empty body → 400)', 'POST', '/auth/login', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/login', { body: {}, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Requires email', r.data?.details?.some((d: any) => d.field === 'email'))
     .check('Requires password', r.data?.details?.some((d: any) => d.field === 'password'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Login (wrong credentials → 401)', 'POST', '/auth/login', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/login', {
      body: { email: 'nonexistent@test.com', password: 'WrongP@ss1' }, expectStatus: 401,
    });
    const a = new Assertions();
    a.check('Status 401', r.status === 401)
     .check('code === AUTH_INVALID_CREDENTIALS', r.data?.code === 'AUTH_INVALID_CREDENTIALS')
     .check('Does NOT leak user existence', !r.data?.error?.includes('not found'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Login (SQL injection attempt)', 'POST', '/auth/login', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/login', {
      body: { email: "admin'--", password: "' OR '1'='1" }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Rejected (400 or 401)', r.status === 400 || r.status === 401)
     .check('No 500 error', r.status !== 500);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Login (XSS in email field)', 'POST', '/auth/login', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/login', {
      body: { email: '<script>alert(1)</script>@test.com', password: 'TestPass1' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Rejected (400)', r.status === 400 || r.status === 401)
     .check('No 500 error', r.status !== 500);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Successful Login
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'Login with valid credentials', 'POST', '/auth/login', false, async (ctx) => {
    const email = (document.getElementById('test-email') as HTMLInputElement)?.value;
    const password = (document.getElementById('test-password') as HTMLInputElement)?.value;

    if (!email || !password) {
      return { status: 'failed', duration: 0, error: 'Fill in credentials above', assertions: ['✗ No credentials provided — enter email and password above'] };
    }

    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/login', { body: { email, password }, expectStatus: 200 });
    const a = new Assertions();

    const mode = (document.getElementById('test-mode') as HTMLSelectElement)?.value;
    if (r.status === 403 && mode === 'signup') {
      a.check('Account not verified (expected)', true);
      return { status: 'passed', duration: r.duration, statusCode: r.status, response: { ...r.data, _note: 'Not verified — expected for new signups' }, assertions: a.assertions };
    }

    a.check('Status 200', r.status === 200)
     .check('Has access_token (JWT)', typeof r.data?.access_token === 'string' && r.data.access_token.split('.').length === 3)
     .check('Has refresh_token', typeof r.data?.refresh_token === 'string' && r.data.refresh_token.length > 20)
     .check('Has user object', typeof r.data?.user === 'object')
     .check('user.id is UUID', typeof r.data?.user?.id === 'string' && r.data.user.id.includes('-'))
     .check('user.email matches', r.data?.user?.email === email)
     .check('user.name exists', typeof r.data?.user?.name === 'string')
     .check('user.status === active', r.data?.user?.status === 'active')
     .check('Has user.created_at', !!r.data?.user?.created_at)
     .check('Has user.language', typeof r.data?.user?.language === 'string');

    if (r.ok && r.data?.access_token) {
      ctx.setToken(r.data.access_token);
      if (r.data.refresh_token) ctx.setRefreshToken(r.data.refresh_token);
      if (r.data.user?.id) ctx.createdIds.userId = r.data.user.id;
    }

    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Token Refresh & Rotation
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'Refresh token (rotate)', 'POST', '/auth/refresh', true, async (ctx) => {
    if (!ctx.refreshToken) return skipResult('No refresh token — login may have failed');

    const oldRefresh = ctx.refreshToken;
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/refresh', { body: { refresh_token: ctx.refreshToken }, expectStatus: 200 });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('New access_token', typeof r.data?.access_token === 'string')
     .check('New refresh_token', typeof r.data?.refresh_token === 'string')
     .check('Refresh token rotated (different)', r.data?.refresh_token !== oldRefresh);

    if (r.ok && r.data?.access_token) {
      ctx.setToken(r.data.access_token);
      if (r.data.refresh_token) ctx.setRefreshToken(r.data.refresh_token);
    }

    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Refresh (invalid token → 401)', 'POST', '/auth/refresh', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/refresh', { body: { refresh_token: 'invalid-token-xyz' }, expectStatus: 401 });
    const a = new Assertions();
    a.check('Status 401', r.status === 401)
     .check('Has error code', !!r.data?.code);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Refresh (empty body → 400)', 'POST', '/auth/refresh', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/refresh', { body: {}, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Requires refresh_token field', r.data?.details?.some((d: any) => d.field === 'refresh_token'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Profile Retrieval
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'GET /users/me (profile shape)', 'GET', '/users/me', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');

    const r = await apiCall(ctx.baseUrl, 'GET', '/users/me', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has id', typeof r.data?.id === 'string')
     .check('Has email', typeof r.data?.email === 'string')
     .check('Has name', typeof r.data?.name === 'string')
     .check('Has language', typeof r.data?.language === 'string')
     .check('Has status', typeof r.data?.status === 'string')
     .check('Has onboarding_completed', typeof r.data?.onboarding_completed === 'boolean')
     .check('Has created_at', !!r.data?.created_at)
     .check('Has updated_at', !!r.data?.updated_at)
     .check('No password_hash leaked', !r.data?.password_hash);

    if (r.ok && r.data?.id) ctx.createdIds.userId = r.data.id;

    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'GET /auth/me (same as /users/me)', 'GET', '/auth/me', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');

    const r = await apiCall(ctx.baseUrl, 'GET', '/auth/me', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Same user ID', r.data?.id === ctx.createdIds.userId)
     .check('No password leaked', !r.data?.password_hash);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Auth Guards
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'No token → AUTH_MISSING_TOKEN', 'GET', '/users/me', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'GET', '/users/me', { expectStatus: 401 });
    const a = new Assertions();
    a.check('Status 401', r.status === 401)
     .check('code === AUTH_MISSING_TOKEN', r.data?.code === 'AUTH_MISSING_TOKEN')
     .check('Has requestId', typeof r.data?.requestId === 'string');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Invalid JWT → AUTH_TOKEN_INVALID', 'GET', '/users/me', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'GET', '/users/me', { token: 'not.a.jwt', expectStatus: 401 });
    const a = new Assertions();
    a.check('Status 401', r.status === 401)
     .check('code === AUTH_TOKEN_INVALID', r.data?.code === 'AUTH_TOKEN_INVALID');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Wrong auth scheme → 401', 'GET', '/users/me', false, async () => {
    const start = performance.now();
    const res = await fetch('https://api.flowkyn.com/v1/users/me', {
      headers: { Authorization: 'Basic dGVzdDp0ZXN0' },
    });
    const duration = Math.round(performance.now() - start);
    const data = await res.json().catch(() => null);
    const a = new Assertions();
    a.check('Status 401', res.status === 401);
    return { status: a.passed ? 'passed' : 'failed', duration, statusCode: res.status, response: data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Error response has standard shape', 'GET', '/users/me', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'GET', '/users/me', { expectStatus: 401 });
    const a = new Assertions();
    a.check('Has "error" (string)', typeof r.data?.error === 'string')
     .check('Has "code" (string)', typeof r.data?.code === 'string')
     .check('Has "statusCode" (number)', typeof r.data?.statusCode === 'number')
     .check('Has "requestId" (string)', typeof r.data?.requestId === 'string')
     .check('Has "timestamp" (ISO)', typeof r.data?.timestamp === 'string' && r.data.timestamp.includes('T'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Email Verification & Password Reset Guards
  // ═══════════════════════════════════════════════════════════════════════════

  defineTest(tests, 'Auth', 'Verify email (bad token → 400)', 'POST', '/auth/verify-email', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/verify-email', {
      body: { token: 'invalid-token' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400 or 404', r.status === 400 || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Reset password (bad token → 400)', 'POST', '/auth/reset-password', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/reset-password', {
      body: { token: 'invalid-token', password: 'NewPass123' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400 or 404', r.status === 400 || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Auth', 'Forgot password (empty → 400)', 'POST', '/auth/forgot-password', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/forgot-password', { body: {}, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Requires email', r.data?.details?.some((d: any) => d.field === 'email'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}

// ═══════════════════════════════════════════════════════════════════════════
// Logout (runs at end of all suites)
// ═══════════════════════════════════════════════════════════════════════════

export function authLogoutTest(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Auth', 'Logout', 'POST', '/auth/logout', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — nothing to logout');

    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/logout', {
      token: ctx.token,
      body: ctx.refreshToken ? { refresh_token: ctx.refreshToken } : undefined,
    });
    const a = new Assertions();
    a.check('Status 200', r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
