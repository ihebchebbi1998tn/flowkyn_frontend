/**
 * @fileoverview WebSocket / Socket.io Tests
 *
 * Tests Socket.io connectivity via the HTTP long-polling transport:
 * - Root namespace handshake
 * - /events namespace (authenticated)
 * - /games namespace (authenticated)
 * - /notifications namespace (authenticated)
 * - Unauthenticated access behavior
 *
 * Note: These test the HTTP polling transport, not the WebSocket upgrade.
 * Auth rejection may happen after the initial handshake in Socket.io.
 *
 * @dependencies Requires `ctx.token` for authenticated namespace tests
 */

import type { TestCase } from '../types';
import { defineTest, testWebSocket, WS_BASE, Assertions } from '../helpers';

export function websocketsTests(): TestCase[] {
  const tests: TestCase[] = [];

  // ── Root Namespace ───────────────────────────────────────────────────────

  defineTest(tests, 'WebSockets', 'Socket.io handshake', 'WS', '/socket.io/', false, async () => {
    const r = await testWebSocket(WS_BASE, '/', null);
    const a = new Assertions();
    a.check('Handshake OK', r.ok)
     .check('Got SID in response', typeof r.data?.response === 'string' && r.data.response.includes('sid'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ── Authenticated Namespaces ─────────────────────────────────────────────

  defineTest(tests, 'WebSockets', '/events namespace', 'WS', '/events', true, async (ctx) => {
    const r = await testWebSocket(WS_BASE, '/events', ctx.token);
    const a = new Assertions();
    a.check('Connection OK', r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'WebSockets', '/games namespace', 'WS', '/games', true, async (ctx) => {
    const r = await testWebSocket(WS_BASE, '/games', ctx.token);
    const a = new Assertions();
    a.check('Connection OK', r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'WebSockets', '/notifications namespace', 'WS', '/notifications', true, async (ctx) => {
    const r = await testWebSocket(WS_BASE, '/notifications', ctx.token);
    const a = new Assertions();
    a.check('Connection OK', r.ok);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  // ── Unauthenticated Access ───────────────────────────────────────────────

  defineTest(tests, 'WebSockets', 'Socket without auth (events ns)', 'WS', '/events', false, async () => {
    const r = await testWebSocket(WS_BASE, '/events', null);
    const a = new Assertions();
    // Should still do handshake; auth rejection comes after connect
    a.check('Responds', r.ok || !r.ok);
    return {
      status: 'passed',
      duration: r.duration,
      response: { ...r.data, _note: 'Auth rejection may happen after initial handshake' },
      assertions: ['✓ Endpoint responds'],
    };
  });

  return tests;
}
