import { api } from '@/features/app/api/client';

export interface OrganizationEngagementMetrics {
  id: string;
  org_id: string;
  health_score: number;
  member_count: number;
  active_member_count: number;
  average_engagement_score: number;
  feature_adoption_percentage: number;
  total_sessions_this_month: number;
  total_games_this_month: number;
  average_session_duration_minutes: number;
  retention_rate: number;
  created_at: string;
  updated_at: string;
}

export interface OrgDashboardData {
  totalOrganizations: number;
  averageHealthScore: number;
  organizationsAboveThreshold: number;
  organizationsBelowThreshold: number;
  totalActiveMembers: number;
  totalSessionsThisMonth: number;
  topOrganizations: OrganizationEngagementMetrics[];
  atRiskOrganizations: OrganizationEngagementMetrics[];
}

export const organizationAnalyticsApi = {
  getOrgMetrics: (orgId: string) =>
    api.get<OrganizationEngagementMetrics>(`/admin/org-analytics/org/${orgId}`),

  updateHealth: (orgId: string) =>
    api.post<OrganizationEngagementMetrics>(`/admin/org-analytics/org/${orgId}/update-health`),

  updateMembers: (orgId: string) =>
    api.post<OrganizationEngagementMetrics>(`/admin/org-analytics/org/${orgId}/update-members`),

  recordActivity: (orgId: string, activityType: 'session' | 'game') =>
    api.post<OrganizationEngagementMetrics>(`/admin/org-analytics/org/${orgId}/activity`, {
      activityType,
    }),

  getTopOrganizations: (limit = 10) =>
    api.get<OrganizationEngagementMetrics[]>('/admin/org-analytics/top', { limit: String(limit) }),

  getAtRiskOrganizations: (threshold = 40) =>
    api.get<OrganizationEngagementMetrics[]>('/admin/org-analytics/at-risk', {
      threshold: String(threshold),
    }),

  compareOrganizations: (orgIds: string[]) =>
    api.post<OrganizationEngagementMetrics[]>('/admin/org-analytics/compare', { orgIds }),

  getOrgTrends: (orgId: string, days = 30) =>
    api.get(`/admin/org-analytics/org/${orgId}/trends`, { days: String(days) }),

  getDashboard: () =>
    api.get<OrgDashboardData>('/admin/org-analytics/dashboard'),
};
