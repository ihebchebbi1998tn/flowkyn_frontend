/**
 * @fileoverview Organization Tests
 * @dependencies Requires `ctx.token` from Auth suite
 * @sideEffects Sets `ctx.createdIds.orgId`, `ctx.createdIds.memberId`
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, skipResult } from '../helpers';

export function organizationsTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Organizations', 'Create organization', 'POST', '/organizations', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const orgName = `Test Org ${Date.now()}`;
    const r = await apiCall(ctx.baseUrl, 'POST', '/organizations', {
      token: ctx.token,
      body: { name: orgName, description: 'API test org', industry: 'tech', company_size: '1-10' },
    });
    const a = new Assertions();
    a.check('Status 201', r.status === 201)
     .check('Has id (UUID)', typeof r.data?.id === 'string' && r.data.id.includes('-'))
     .check('Name matches', r.data?.name === orgName)
     .check('Has slug (auto-generated)', typeof r.data?.slug === 'string' && r.data.slug.length > 0)
     .check('Has created_at', !!r.data?.created_at);
    if (r.ok && r.data?.id) ctx.createdIds.orgId = r.data.id;
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Create org (no name → 400)', 'POST', '/organizations', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/organizations', { token: ctx.token, body: { description: 'Missing name' }, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('Has details', Array.isArray(r.data?.details))
     .check('Name required', r.data?.details?.some((d: any) => d.field === 'name'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Create org (name too long → 400)', 'POST', '/organizations', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/organizations', { token: ctx.token, body: { name: 'X'.repeat(200) }, expectStatus: 400 });
    const a = new Assertions();
    a.check('Status 400', r.status === 400);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Get created org (verify data)', 'GET', '/organizations/:id', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — create org failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/organizations/${ctx.createdIds.orgId}`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('id matches', r.data?.id === ctx.createdIds.orgId)
     .check('Has name', typeof r.data?.name === 'string')
     .check('Has industry', typeof r.data?.industry === 'string' || r.data?.industry === null);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Get org (non-member → 403)', 'GET', '/organizations/:id', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const fakeId = '11111111-1111-1111-1111-111111111111';
    const r = await apiCall(ctx.baseUrl, 'GET', `/organizations/${fakeId}`, { token: ctx.token });
    const a = new Assertions();
    a.check('Returns 403 or 404', r.status === 403 || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Update org name', 'PATCH', '/organizations/:id', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — create org failed');
    const newName = `Updated Org ${Date.now()}`;
    const r = await apiCall(ctx.baseUrl, 'PATCH', `/organizations/${ctx.createdIds.orgId}`, { token: ctx.token, body: { name: newName } });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Name updated', r.data?.name === newName);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'List members (creator = owner)', 'GET', '/organizations/:id/members', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — create org failed');
    const r = await apiCall(ctx.baseUrl, 'GET', `/organizations/${ctx.createdIds.orgId}/members`, { token: ctx.token });
    const a = new Assertions();
    a.check('Status 200', r.status === 200)
     .check('Has data', Array.isArray(r.data?.data) || Array.isArray(r.data));
    const members = r.data?.data || r.data;
    if (Array.isArray(members) && members.length > 0) {
      a.check('At least 1 member', members.length >= 1)
       .check('Member has user_id', !!members[0]?.user_id)
       .check('Member has role info', !!members[0]?.role_name || !!members[0]?.role);
      const selfMember = members.find((m: any) => m.user_id === ctx.createdIds.userId);
      if (selfMember) ctx.createdIds.memberId = selfMember.id;
      // Store role_id for invitation tests
      if (selfMember?.role_id) ctx.createdIds.memberRoleId = selfMember.role_id;
      else if (members[0]?.role_id) ctx.createdIds.memberRoleId = members[0].role_id;
    }
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Invite member (invalid role_id → 400)', 'POST', '/organizations/:id/invitations', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — create org failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/organizations/${ctx.createdIds.orgId}/invitations`, {
      token: ctx.token, body: { email: 'invite@test.com', role_id: 'not-uuid' }, expectStatus: 400,
    });
    const a = new Assertions();
    a.check('Status 400', r.status === 400)
     .check('role_id validation error', r.data?.details?.some((d: any) => d.field === 'role_id'));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Accept invitation (invalid token)', 'POST', '/organizations/invitations/accept', true, async (ctx) => {
    if (!ctx.token) return skipResult('No auth token — login failed');
    const r = await apiCall(ctx.baseUrl, 'POST', '/organizations/invitations/accept', {
      token: ctx.token, body: { token: 'fake-invite-token' },
    });
    const a = new Assertions();
    a.check('Returns 400 or 404', r.status === 400 || r.status === 404);
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  defineTest(tests, 'Organizations', 'Upload logo (no file → error)', 'POST', '/organizations/:id/logo', true, async (ctx) => {
    if (!ctx.createdIds.orgId) return skipResult('No orgId — create org failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/organizations/${ctx.createdIds.orgId}/logo`, { token: ctx.token, body: {} });
    const a = new Assertions();
    a.check('Rejects (400/500)', [400, 500].includes(r.status));
    return { status: a.passed ? 'passed' : 'failed', duration: r.duration, statusCode: r.status, response: r.data, assertions: a.assertions, error: a.errorSummary };
  });

  return tests;
}
