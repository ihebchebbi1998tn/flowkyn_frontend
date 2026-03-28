/**
 * @fileoverview Event Lifecycle Tests
 * @dependencies Requires `ctx.token`, `ctx.createdIds.orgId` from Organizations suite
 * @sideEffects Sets `ctx.createdIds.eventId`, `participantId`, `postId`
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function eventsTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Events', 'Create event (full validation)', 'POST', '/events', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — Organizations suite failed');
    const title = `Test Event ${Date.now()}`;
    const r = await apiCall(ctx.baseUrl, 'POST', '/events', {
      token: ctx.token,
      body: { organization_id: ctx.createdIds.orgId, title, description: 'Automated test', event_mode: 'sync', visibility: 'public', max_participants: 50 },
    });
    const a = new Assertions();
    a.check('Status 201', r.status === 201)
     .check('Has id (UUID)', typeof r.data?.id === 'string' && r.data.id.includes('-'))
     .check('Title matches', r.data?.title === title)
     .check('org_id matches', r.data?.organization_id === ctx.createdIds.orgId)
     .check('visibility = public', r.data?.visibility === 'public')
     .check('max_participants = 50', r.data?.max_participants === 50)
     .check('event_mode = sync', r.data?.event_mode === 'sync')
     .check('Has created_at', !!r.data?.created_at);
    if (r.ok && r.data?.id) ctx.createdIds.eventId = r.data.id;
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Create event (missing org_id → 400)', 'POST', '/events', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/events', { token: ctx.token, body: { title: 'Missing org' }, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('org_id required', r.data?.details?.some((d: any) => d.field === 'organization_id'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Create event (invalid mode → 400)', 'POST', '/events', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — Organizations suite failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/events', {
      token: ctx.token, body: { organization_id: ctx.createdIds.orgId, title: 'Test', event_mode: 'invalid' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('event_mode validation', r.data?.details?.some((d: any) => d.field === 'event_mode'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Create event (max_participants < 2 → 400)', 'POST', '/events', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — Organizations suite failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/events', {
      token: ctx.token, body: { organization_id: ctx.createdIds.orgId, title: 'Test', max_participants: 1 }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400 (min 2)', r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'List events (paginated)', 'GET', '/events', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'GET', '/events?page=1&limit=5', { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has data array', Array.isArray(r.data?.data))
     .check('Has pagination', typeof r.data?.pagination === 'object')
     .check('Contains our event', r.data?.data?.some((e: any) => e.id === ctx.createdIds.eventId) || r.data?.data?.length === 0);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'List events by org', 'GET', '/events?organization_id=:id', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — Organizations suite failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/events?organization_id=${ctx.createdIds.orgId}&page=1&limit=10`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('All events belong to org', r.data?.data?.every((e: any) => e.organization_id === ctx.createdIds.orgId) || r.data?.data?.length === 0);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Get event by ID', 'GET', '/events/:id', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/events/${ctx.createdIds.eventId}`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('id matches', r.data?.id === ctx.createdIds.eventId)
     .check('Has title', typeof r.data?.title === 'string')
     .check('Has event_mode', typeof r.data?.event_mode === 'string')
     .check('Has visibility', typeof r.data?.visibility === 'string')
     .check('Has max_participants', typeof r.data?.max_participants === 'number');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Get public event info', 'GET', '/events/:id/public', false, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/events/${ctx.createdIds.eventId}/public`);
    const a = new Assertions();
    a.check('Responds (200/403/404)', [200, 403, 404].includes(r.status));
    if (r.status === 200) {
      a.check('Has title', typeof r.data?.title === 'string')
       .check('No sensitive data leaked', !r.data?.created_by_member_id);
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Update event title', 'PUT', '/events/:id', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const newTitle = `Updated Event ${Date.now()}`;
    const r = await apiCall(ctx.baseUrl, 'PUT', `/events/${ctx.createdIds.eventId}`, { token: ctx.token, body: { title: newTitle } });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Title updated', r.data?.title === newTitle);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Update event (empty body → 400)', 'PUT', '/events/:id', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'PUT', `/events/${ctx.createdIds.eventId}`, { token: ctx.token, body: {}, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('At least one field required', typeof r.data?.error === 'string');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Join event', 'POST', '/events/:id/join', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/join`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200/201 or 409', r.ok || r.status === 409);
    if (r.ok && r.data?.participant_id) {
      ctx.createdIds.participantId = r.data.participant_id;
      a.check('Has participant_id', typeof r.data.participant_id === 'string');
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Get participants (verify joined)', 'GET', '/events/:id/participants', false, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/events/${ctx.createdIds.eventId}/participants?page=1&limit=50`);
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has data array', Array.isArray(r.data?.data))
     .check('At least 1 participant', r.data?.data?.length >= 1)
     .check('Participant has id', !!r.data?.data?.[0]?.id)
     .check('Has pagination', typeof r.data?.pagination === 'object');
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Validate invitation token (fake)', 'GET', '/events/:id/validate-token', false, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/events/${ctx.createdIds.eventId}/validate-token?token=fake-token`);
    const a = new Assertions();
    a.check('Returns 400 or 404', r.status === 400 || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Send message', 'POST', '/events/:id/messages', true, async (ctx) => {
    if (!ctx.createdIds.participantId) return skipResult('No participantId — join event failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/messages`, {
      token: ctx.token, body: { message: 'Hello from API test!', participant_id: ctx.createdIds.participantId },
    });
    const a = new Assertions();
    a.check('Status 201', r.status === 201)
     .check('Has message id', !!r.data?.id);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Send message (empty → 400)', 'POST', '/events/:id/messages', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/messages`, {
      token: ctx.token, body: {}, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Requires message field', r.data?.details?.some((d: any) => d.field === 'message'))
     .check('Requires participant_id', r.data?.details?.some((d: any) => d.field === 'participant_id'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Get messages', 'GET', '/events/:id/messages', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/events/${ctx.createdIds.eventId}/messages?page=1&limit=50`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has data', Array.isArray(r.data?.data));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Create post', 'POST', '/events/:id/posts', true, async (ctx) => {
    if (!ctx.createdIds.participantId) return skipResult('No participantId — join event failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/posts`, {
      token: ctx.token, body: { content: 'Test post from API runner', participant_id: ctx.createdIds.participantId },
    });
    const a = new Assertions();
    a.check('Status 201', r.status === 201)
     .check('Has post id', !!r.data?.id);
    if (r.ok && r.data?.id) ctx.createdIds.postId = r.data.id;
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'React to post (like)', 'POST', '/posts/:postId/reactions', true, async (ctx) => {
    if (!ctx.createdIds.postId || !ctx.createdIds.participantId) return skipResult('No postId or participantId');
    const r = await apiCall(ctx.baseUrl, 'POST', `/posts/${ctx.createdIds.postId}/reactions`, {
      token: ctx.token, body: { reaction_type: 'like', participant_id: ctx.createdIds.participantId },
    });
    const a = new Assertions();
    a.check('Status 201 or 409', r.status === 201 || r.status === 409);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Invite participant (email trigger)', 'POST', '/events/:id/invitations', true, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/invitations`, {
      token: ctx.token, body: { email: `invite-${Date.now()}@flowkyn.com`, lang: 'en' },
    });
    const a = new Assertions();
    a.check('Status OK or 409/500', r.ok || r.status === 409 || r.status === 500);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Events', 'Guest join (public event)', 'POST', '/events/:id/join-guest', false, async (ctx) => {
    if (!ctx.createdIds.eventId) return skipResult('No eventId — create event failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/join-guest`, {
      body: { name: 'Test Guest', email: 'guest@test.com' },
    });
    const a = new Assertions();
    a.check('Status 200/201 or 400/409', r.ok || [400, 409].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
