import { useQuery } from '@tanstack/react-query';
import { hrAnalyticsApi } from '@/features/app/api/hrAnalytics';

export const hrAnalyticsKeys = {
  dashboard: (orgId: string) => ['hr-analytics', 'dashboard', orgId] as const,
  export: (orgId: string) => ['hr-analytics', 'export', orgId] as const,
};

export function useHRAnalyticsDashboard(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: hrAnalyticsKeys.dashboard(organizationId),
    queryFn: () => hrAnalyticsApi.getDashboard(organizationId),
    enabled: !!organizationId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
