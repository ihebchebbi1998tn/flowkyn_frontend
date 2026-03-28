import { api } from './client';

export const auditLogsApi = {
  // Note: Audit logs are created server-side only (no POST endpoint).
  // Use this module to read audit logs for an organization.

  listByOrg: (orgId: string) =>
    api.get(`/audit-logs/organizations/${orgId}`),
};
