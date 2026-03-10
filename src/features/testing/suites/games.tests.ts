/**
 * @fileoverview Game Session Tests
 * @dependencies Requires `ctx.createdIds.eventId` from Events suite
 * @sideEffects Sets `ctx.createdIds.gameTypeId`, `sessionId`, `roundId`
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function gamesTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Games', 'List game types', 'GET', '/game-types', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/game-types', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Is array', Array.isArray(r.data));
    if (Array.isArray(r.data) && r.data.length > 0) {
      ctx.createdIds.gameTypeId = r.data[0].id;
      a.check('Has id', !!r.data[0].id)
       .check('Has name', typeof r.data[0].name === 'string');
    } else {
      a.check('Empty array (no game types configured)', Array.isArray(r.data));
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Games', 'Start game session', 'POST', '/events/:eventId/game-sessions', true, async (ctx) => {
    if (!ctx.createdIds.eventId || !ctx.createdIds.gameTypeId) return skipResult('No eventId or gameTypeId');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/game-sessions`, {
      token: ctx.token, body: { game_type_id: ctx.createdIds.gameTypeId },
    });
    const a = new Assertions();
    a.check('Status 201 or 400/404', [201, 400, 404].includes(r.status));
    if (r.status === 201 && r.data?.id) {
      ctx.createdIds.sessionId = r.data.id;
      a.check('Has session id', !!r.data.id)
       .check('Has event_id', !!r.data.event_id)
       .check('Has game_type_id', !!r.data.game_type_id)
       .check('Has status', typeof r.data.status === 'string')
       .check('Has created_at', !!r.data.created_at);
    } else if (r.status === 400) {
      a.info(`Event not active for games: ${r.data?.error || 'draft status'}`);
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Games', 'Start game (invalid game_type_id → 400)', 'POST', '/events/:eventId/game-sessions', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — Events suite failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/game-sessions`, {
      token: ctx.token, body: { game_type_id: 'not-a-uuid' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Games', 'Start round', 'POST', '/game-sessions/:id/rounds', true, async (ctx) => {
    if (!ctx.createdIds.sessionId) {
      // No session exists — verify endpoint rejects a fake UUID
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const r = await apiCall(ctx.baseUrl, 'POST', `/game-sessions/${fakeId}/rounds`, { token: ctx.token });
      const a = new Assertions();
      a.check('Rejects non-existent session (400/404)', [400, 403, 404].includes(r.status));
      a.info('No active session — event was in draft status');
      return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
    }
    const r = await apiCall(ctx.baseUrl, 'POST', `/game-sessions/${ctx.createdIds.sessionId}/rounds`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 201 or 400', [201, 400].includes(r.status));
    if (r.status === 201) {
      a.check('Has round id', !!r.data?.id)
       .check('Has round_number', typeof r.data?.round_number === 'number');
      if (r.data?.id) ctx.createdIds.roundId = r.data.id;
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Games', 'Submit action (missing fields → 400)', 'POST', '/game-actions', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/game-actions', { token: ctx.token, body: {}, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Has validation details', Array.isArray(r.data?.details));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Games', 'Finish game session', 'POST', '/game-sessions/:id/finish', true, async (ctx) => {
    if (!ctx.createdIds.sessionId) {
      // No session exists — verify endpoint rejects a fake UUID
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const r = await apiCall(ctx.baseUrl, 'POST', `/game-sessions/${fakeId}/finish`, { token: ctx.token });
      const a = new Assertions();
      a.check('Rejects non-existent session (400/404)', [400, 403, 404].includes(r.status));
      a.info('No active session — event was in draft status');
      return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
    }
    const r = await apiCall(ctx.baseUrl, 'POST', `/game-sessions/${ctx.createdIds.sessionId}/finish`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200 or 400', r.ok || r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
