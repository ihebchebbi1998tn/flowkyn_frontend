/**
 * @fileoverview Contact Form Tests
 *
 * Tests for the public contact form endpoint:
 * - Submit valid contact form
 * - Empty body validation
 * - Invalid email validation
 * - Missing required message field
 *
 * @dependencies None — no auth required
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions } from '../helpers';

export function contactTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Contact', 'Submit contact form', 'POST', '/contact', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/contact', {
      body: {
        name: 'UI Test',
        email: 'test@flowkyn.com',
        subject: 'Automated Test',
        message: 'This is an automated API test submission.',
      },
      expectStatus: 201,
    });
    const a = new Assertions();
    a.check('Status 201', r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Contact', 'Submit (no body → 400)', 'POST', '/contact', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/contact', { body: {}, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Contact', 'Submit (invalid email → 400)', 'POST', '/contact', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/contact', {
      body: { name: 'Test', email: 'not-email', message: 'Hello' },
      expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Contact', 'Submit (no message → 400)', 'POST', '/contact', false, async (ctx) => {
    const r = await apiCall(ctx.baseUrl, 'POST', '/contact', {
      body: { name: 'Test', email: 'test@test.com' },
      expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
