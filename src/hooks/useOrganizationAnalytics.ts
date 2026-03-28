import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationAnalyticsApi } from '@/api/organizationAnalytics';

const ORG_ANALYTICS_KEY = ['organization-analytics'];

export function useOrganizationMetrics(organizationId: string) {
  return useQuery({
    queryKey: [...ORG_ANALYTICS_KEY, organizationId],
    queryFn: () => organizationAnalyticsApi.getOrgMetrics(organizationId),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateOrganizationHealth(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => organizationAnalyticsApi.updateHealth(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ORG_ANALYTICS_KEY, organizationId] });
    },
  });
}

export function useUpdateOrganizationMembers(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => organizationAnalyticsApi.updateMembers(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ORG_ANALYTICS_KEY, organizationId] });
    },
  });
}

export function useRecordOrganizationActivity(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityType: 'session' | 'game') =>
      organizationAnalyticsApi.recordActivity(organizationId, activityType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ORG_ANALYTICS_KEY, organizationId] });
    },
  });
}

export function useTopOrganizations(limit = 10) {
  return useQuery({
    queryKey: [...ORG_ANALYTICS_KEY, 'top', limit],
    queryFn: () => organizationAnalyticsApi.getTopOrganizations(limit),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAtRiskOrganizations(threshold = 40) {
  return useQuery({
    queryKey: [...ORG_ANALYTICS_KEY, 'at-risk', threshold],
    queryFn: () => organizationAnalyticsApi.getAtRiskOrganizations(threshold),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCompareOrganizations(orgIds?: string[]) {
  return useMutation({
    mutationFn: (ids?: string[]) => organizationAnalyticsApi.compareOrganizations(ids || orgIds || []),
  });
}

export function useOrganizationTrends(organizationId: string, days = 30) {
  return useQuery({
    queryKey: [...ORG_ANALYTICS_KEY, 'trends', organizationId, days],
    queryFn: () => organizationAnalyticsApi.getOrgTrends(organizationId, days),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useOrganizationDashboard() {
  return useQuery({
    queryKey: [...ORG_ANALYTICS_KEY, 'dashboard'],
    queryFn: () => organizationAnalyticsApi.getDashboard(),
    staleTime: 10 * 60 * 1000,
  });
}
