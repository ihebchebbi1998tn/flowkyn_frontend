import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsReportsApi, CreateReportRequest } from '@/api/analyticsReports';

const REPORTS_KEY = ['analytics-reports'];

export function useReportsList(reportType?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'list', reportType, page, limit],
    queryFn: () => analyticsReportsApi.list(reportType, page, limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReport(reportId: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, reportId],
    queryFn: () => analyticsReportsApi.get(reportId),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportRequest) => analyticsReportsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...REPORTS_KEY, 'list'] });
    },
  });
}

export function useUpdateReport(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateReportRequest>) => analyticsReportsApi.update(reportId, data),
    onSuccess: (result) => {
      queryClient.setQueryData([...REPORTS_KEY, reportId], result);
      queryClient.invalidateQueries({ queryKey: [...REPORTS_KEY, 'list'] });
    },
  });
}

export function useDeleteReport(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analyticsReportsApi.delete(reportId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: [...REPORTS_KEY, reportId] });
      queryClient.invalidateQueries({ queryKey: [...REPORTS_KEY, 'list'] });
    },
  });
}

export function useGenerateEngagementReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analyticsReportsApi.generateEngagement(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...REPORTS_KEY, 'list'] });
    },
  });
}

export function useGenerateUsageReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { gameKey?: string; orgId?: string; startDate?: Date; endDate?: Date }) =>
      analyticsReportsApi.generateUsage(params?.gameKey, params?.orgId, params?.startDate, params?.endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...REPORTS_KEY, 'list'] });
    },
  });
}

export function useGenerateRetentionReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => analyticsReportsApi.generateRetention(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...REPORTS_KEY, 'list'] });
    },
  });
}

export function useExportReportCsv(reportId: string) {
  return useMutation({
    mutationFn: () => analyticsReportsApi.exportToCsv(reportId),
  });
}

export function useExportReportJson(reportId: string) {
  return useMutation({
    mutationFn: () => analyticsReportsApi.exportToJson(reportId),
  });
}

export function useScheduleReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' }) =>
      analyticsReportsApi.schedule(params.id, params.frequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...REPORTS_KEY] });
    },
  });
}

export function useGetScheduledReports() {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'scheduled'],
    queryFn: () => analyticsReportsApi.getScheduled(),
    staleTime: 5 * 60 * 1000,
  });
}
