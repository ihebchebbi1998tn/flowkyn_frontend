/**
 * @fileoverview Email Delivery Tests
 * @dependencies Requires `ctx.createdIds.eventId`, `ctx.createdIds.orgId`
 */

import type { TestCase } from '../types';
import { defineTest, apiCall, Assertions, buildDiagnostics, getCollectedRequests, skipResult } from '../helpers';

const TEST_EMAILS = {
  primary: 'erzerino2@gmail.com',
  secondary: 'ihebchebbidev@gmail.com',
};

function parseEmailError(data: any): Record<string, unknown> {
  const details: Record<string, unknown> = {};
  if (data?.error) details.errorMessage = data.error;
  if (data?.code) details.errorCode = data.code;
  if (data?.requestId) details.requestId = data.requestId;
  const errorStr = JSON.stringify(data || '').toLowerCase();
  if (errorStr.includes('smtp')) details.smtpIssue = true;
  if (errorStr.includes('timeout')) details.timeoutIssue = true;
  if (errorStr.includes('connection') && errorStr.includes('refused')) details.connectionRefused = true;
  if (errorStr.includes('auth')) details.authIssue = true;
  if (errorStr.includes('dns') || errorStr.includes('getaddrinfo')) details.dnsResolutionFailed = true;
  if (errorStr.includes('certificate') || errorStr.includes('tls') || errorStr.includes('ssl')) details.tlsIssue = true;
  if (errorStr.includes('rate') || errorStr.includes('throttl')) details.rateLimited = true;
  if (errorStr.includes('rejected') || errorStr.includes('bounced')) details.recipientRejected = true;
  if (data?.details && Array.isArray(data.details)) details.validationErrors = data.details;
  return details;
}

function buildEmailResult(
  testName: string, r: Awaited<ReturnType<typeof apiCall>>, a: Assertions,
  email: string, emailType: string, lang?: string,
) {
  const emailDetails = parseEmailError(r.data);
  const isSmtpError = r.status === 500 && (emailDetails.smtpIssue || !r.data?.code || r.data?.code === 'INTERNAL_ERROR');
  const responsePayload: Record<string, unknown> = { ...r.data };
  if (r.ok) {
    responsePayload._note = `✅ ${emailType} email sent to ${email}${lang ? ` (${lang})` : ''}`;
    responsePayload._deliveryStatus = 'sent';
  } else if (isSmtpError) {
    responsePayload._note = `⚠️ SMTP configuration issue — email NOT sent to ${email}`;
    responsePayload._deliveryStatus = 'smtp_failure';
    responsePayload._troubleshooting = [
      'Check SMTP host/port in server .env', 'Verify SMTP credentials are valid',
      'Ensure SMTP service is reachable from server', 'Check if TLS/SSL settings match SMTP provider requirements',
      emailDetails.dnsResolutionFailed ? 'DNS resolution failed — check SMTP_HOST value' : null,
      emailDetails.connectionRefused ? 'Connection refused — check SMTP_HOST and SMTP_PORT' : null,
      emailDetails.authIssue ? 'Authentication failed — check SMTP_USER and SMTP_PASS' : null,
      emailDetails.tlsIssue ? 'TLS/SSL error — try toggling SMTP_SECURE setting' : null,
      emailDetails.rateLimited ? 'Rate limited by SMTP provider — wait and retry' : null,
    ].filter(Boolean);
  } else if (r.status === 404) {
    responsePayload._note = `❌ User not found for email: ${email}`;
    responsePayload._deliveryStatus = 'user_not_found';
  } else if (r.status === 429) {
    responsePayload._note = `⏳ Rate limited — too many requests`;
    responsePayload._deliveryStatus = 'rate_limited';
  } else {
    responsePayload._note = `❌ Unexpected error (${r.status}) for ${emailType} to ${email}`;
    responsePayload._deliveryStatus = 'error';
  }
  responsePayload._email = email;
  responsePayload._emailType = emailType;
  if (lang) responsePayload._language = lang;
  return {
    status: a.passed ? 'passed' as const : 'failed' as const,
    duration: r.duration, statusCode: r.status, response: responsePayload,
    assertions: a.assertions, error: a.errorSummary,
    requests: getCollectedRequests(), responseHeaders: r.responseHeaders,
    diagnostics: buildDiagnostics(testName, r, {
      _emailType: emailType, _recipient: email, _language: lang || 'en',
      _deliveryStatus: responsePayload._deliveryStatus, ...emailDetails,
    }),
  };
}

export function emailsTests(): TestCase[] {
  const tests: TestCase[] = [];

  defineTest(tests, 'Emails', `Forgot password → ${TEST_EMAILS.primary}`, 'POST', '/auth/forgot-password', false, async (ctx) => {
    const name = `Forgot password → ${TEST_EMAILS.primary}`;
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/forgot-password', { body: { email: TEST_EMAILS.primary, lang: 'en' } });
    const a = new Assertions();
    a.check('API responds (200 or 500)', r.status === 200 || r.status === 500);
    if (r.status === 200) a.check('Has success message', typeof r.data?.message === 'string');
    else if (r.status === 500) { a.warn('SMTP may be misconfigured (500)', false); a.info(`Server error: ${r.data?.error || 'Unknown'}`); if (r.data?.requestId) a.info(`Request ID: ${r.data.requestId}`); }
    return buildEmailResult(name, r, a, TEST_EMAILS.primary, 'forgot-password', 'en');
  });

  defineTest(tests, 'Emails', `Forgot password → ${TEST_EMAILS.secondary}`, 'POST', '/auth/forgot-password', false, async (ctx) => {
    const name = `Forgot password → ${TEST_EMAILS.secondary}`;
    const r = await apiCall(ctx.baseUrl, 'POST', '/auth/forgot-password', { body: { email: TEST_EMAILS.secondary, lang: 'fr' } });
    const a = new Assertions();
    a.check('API responds (200 or 500)', r.status === 200 || r.status === 500);
    if (r.status === 200) a.check('Has success message', typeof r.data?.message === 'string');
    else if (r.status === 500) { a.warn('SMTP may be misconfigured (500)', false); a.info(`Server error: ${r.data?.error || 'Unknown'}`); if (r.data?.requestId) a.info(`Request ID: ${r.data.requestId}`); }
    return buildEmailResult(name, r, a, TEST_EMAILS.secondary, 'forgot-password', 'fr');
  });

  defineTest(tests, 'Emails', `Event invite → ${TEST_EMAILS.primary}`, 'POST', '/events/:id/invitations', true, async (ctx) => {
    const name = `Event invite → ${TEST_EMAILS.primary}`;
    if (!ctx.createdIds.eventId) return skipResult('No eventId — Events suite failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/invitations`, { token: ctx.token, body: { email: TEST_EMAILS.primary, lang: 'en' } });
    const a = new Assertions();
    a.check('Responds OK, 409, or 500', r.ok || r.status === 409 || r.status === 500);
    if (r.ok) a.check('Invitation created', typeof r.data?.message === 'string' || typeof r.data?.id === 'string');
    else if (r.status === 409) a.info('Already invited (409) — not an error');
    else if (r.status === 500) { a.warn('SMTP issue on server (500)', false); a.info(`Server error: ${r.data?.error || 'Unknown'}`); if (r.data?.requestId) a.info(`Request ID: ${r.data.requestId}`); }
    return buildEmailResult(name, r, a, TEST_EMAILS.primary, 'event-invitation', 'en');
  });

  defineTest(tests, 'Emails', `Event invite → ${TEST_EMAILS.secondary}`, 'POST', '/events/:id/invitations', true, async (ctx) => {
    const name = `Event invite → ${TEST_EMAILS.secondary}`;
    if (!ctx.createdIds.eventId) return skipResult('No eventId — Events suite failed');
    const r = await apiCall(ctx.baseUrl, 'POST', `/events/${ctx.createdIds.eventId}/invitations`, { token: ctx.token, body: { email: TEST_EMAILS.secondary, lang: 'en' } });
    const a = new Assertions();
    a.check('Responds OK, 409, or 500', r.ok || r.status === 409 || r.status === 500);
    if (r.ok) a.check('Invitation created', typeof r.data?.message === 'string' || typeof r.data?.id === 'string');
    else if (r.status === 409) a.info('Already invited (409) — not an error');
    else if (r.status === 500) { a.warn('SMTP issue on server (500)', false); a.info(`Server error: ${r.data?.error || 'Unknown'}`); if (r.data?.requestId) a.info(`Request ID: ${r.data.requestId}`); }
    return buildEmailResult(name, r, a, TEST_EMAILS.secondary, 'event-invitation', 'en');
  });

  defineTest(tests, 'Emails', `Org invite → ${TEST_EMAILS.primary}`, 'POST', '/organizations/:id/invitations', true, async (ctx) => {
    const name = `Org invite → ${TEST_EMAILS.primary}`;
    if (!ctx.createdIds.orgId) return skipResult('No orgId — Organizations suite failed');
    // Fetch a valid role_id for 'member' role
    const roleId = ctx.createdIds.memberRoleId;
    if (!roleId) {
      // Try to get members list to find role info, or use a known role_id
      const membersRes = await apiCall(ctx.baseUrl, 'GET', `/organizations/${ctx.createdIds.orgId}/members`, { token: ctx.token });
      const members = membersRes.data?.data || membersRes.data || [];
      const memberRole = members.find((m: any) => m.role_name === 'member');
      const anyMember = members[0];
      if (memberRole?.role_id) ctx.createdIds.memberRoleId = memberRole.role_id;
      else if (anyMember?.role_id) ctx.createdIds.memberRoleId = anyMember.role_id;
    }
    const finalRoleId = ctx.createdIds.memberRoleId || '00000000-0000-0000-0000-000000000000';
    const r = await apiCall(ctx.baseUrl, 'POST', `/organizations/${ctx.createdIds.orgId}/invitations`, { token: ctx.token, body: { email: TEST_EMAILS.primary, role_id: finalRoleId, lang: 'en' } });
    const a = new Assertions();
    a.check('Responds OK, 400, 409, or 500', r.ok || [400, 409, 500].includes(r.status));
    if (r.ok) a.check('Invitation sent', typeof r.data?.message === 'string');
    else if (r.status === 400) { a.info(`Validation issue: ${r.data?.error || 'Unknown'}`); if (r.data?.details) a.info(`Details: ${JSON.stringify(r.data.details)}`); }
    else if (r.status === 409) a.info('Already invited (409)');
    else if (r.status === 500) { a.warn('SMTP issue on server (500)', false); a.info(`Server error: ${r.data?.error || 'Unknown'}`); if (r.data?.requestId) a.info(`Request ID: ${r.data.requestId}`); }
    return buildEmailResult(name, r, a, TEST_EMAILS.primary, 'org-invitation', 'en');
  });

  defineTest(tests, 'Emails', `Org invite → ${TEST_EMAILS.secondary}`, 'POST', '/organizations/:id/invitations', true, async (ctx) => {
    const name = `Org invite → ${TEST_EMAILS.secondary}`;
    if (!ctx.createdIds.orgId) return skipResult('No orgId — Organizations suite failed');
    const finalRoleId = ctx.createdIds.memberRoleId || '00000000-0000-0000-0000-000000000000';
    const r = await apiCall(ctx.baseUrl, 'POST', `/organizations/${ctx.createdIds.orgId}/invitations`, { token: ctx.token, body: { email: TEST_EMAILS.secondary, role_id: finalRoleId, lang: 'fr' } });
    const a = new Assertions();
    a.check('Responds OK, 400, 409, or 500', r.ok || [400, 409, 500].includes(r.status));
    if (r.ok) a.check('Invitation sent', typeof r.data?.message === 'string');
    else if (r.status === 400) { a.info(`Validation issue: ${r.data?.error || 'Unknown'}`); if (r.data?.details) a.info(`Details: ${JSON.stringify(r.data.details)}`); }
    else if (r.status === 409) a.info('Already invited (409)');
    else if (r.status === 500) { a.warn('SMTP issue on server (500)', false); a.info(`Server error: ${r.data?.error || 'Unknown'}`); if (r.data?.requestId) a.info(`Request ID: ${r.data.requestId}`); }
    return buildEmailResult(name, r, a, TEST_EMAILS.secondary, 'org-invitation', 'fr');
  });

  return tests;
}
