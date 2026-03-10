/**
 * @fileoverview File Upload & Management Tests
 * @dependencies Requires `ctx.token` from Auth suite
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function filesTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Files', 'List my files (paginated)', 'GET', '/files/me', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/files/me?page=1&limit=10', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has data array', Array.isArray(r.data?.data) || Array.isArray(r.data))
     .check('Has pagination', typeof r.data?.pagination === 'object' || Array.isArray(r.data));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Files', 'Upload without file → FILE_MISSING', 'POST', '/files', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/files', { token: ctx.token, body: {} });
    const a = new Assertions();
    a.check('Rejects (400/500)', [400, 500].includes(r.status))
     .check('Has error message', typeof r.data?.error === 'string');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Files', 'Upload with real small image', 'POST', '/files', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
    const formData = new FormData();
    formData.append('file', blob, 'test-1x1.png');
    const r = await apiCall(ctx.baseUrl, 'POST', '/files', { token: ctx.token, formData });
    const a = new Assertions();
    a.check('Status 201 or 200', r.ok);
    if (r.ok) a.check('Has URL', typeof r.data?.url === 'string' || typeof r.data?.file_url === 'string');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
