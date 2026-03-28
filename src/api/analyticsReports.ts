import { api } from '@/features/app/api/client';

export interface AnalyticsReport {
  id: string;
  name: string;
  report_type: 'engagement' | 'usage' | 'performance' | 'retention' | 'custom';
  data: Record<string, any>;
  format: 'json' | 'csv' | 'pdf';
  schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  last_generated_at?: string;
  next_scheduled_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportRequest {
  name: string;
  reportType: 'engagement' | 'usage' | 'performance' | 'retention' | 'custom';
  reportData: Record<string, any>;
  format: 'json' | 'csv' | 'pdf';
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export const analyticsReportsApi = {
  list: (reportType?: string, page = 1, limit = 20) =>
    api.get<{ data: AnalyticsReport[]; total: number }>('/admin/analytics-reports', {
      reportType: reportType || '',
      page: String(page),
      limit: String(limit),
    }),

  get: (id: string) =>
    api.get<AnalyticsReport>(`/admin/analytics-reports/${id}`),

  create: (data: CreateReportRequest) =>
    api.post<AnalyticsReport>('/admin/analytics-reports', data),

  update: (id: string, data: Partial<CreateReportRequest>) =>
    api.put<AnalyticsReport>(`/admin/analytics-reports/${id}`, data),

  delete: (id: string) =>
    api.del(`/admin/analytics-reports/${id}`),

  generateEngagement: () =>
    api.post<AnalyticsReport>('/admin/analytics-reports/generate/engagement'),

  generateUsage: (gameKey?: string, orgId?: string, startDate?: Date, endDate?: Date) =>
    api.post<AnalyticsReport>('/admin/analytics-reports/generate/usage', {
      gameKey,
      orgId,
      startDate,
      endDate,
    }),

  generateRetention: () =>
    api.post<AnalyticsReport>('/admin/analytics-reports/generate/retention'),

  exportToCsv: (id: string) =>
    api.get<Blob>(`/admin/analytics-reports/${id}/export/csv`),

  exportToJson: (id: string) =>
    api.get<string>(`/admin/analytics-reports/${id}/export/json`),

  schedule: (id: string, frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly') =>
    api.post<AnalyticsReport>(`/admin/analytics-reports/${id}/schedule`, { frequency }),

  getScheduled: () =>
    api.get<AnalyticsReport[]>('/admin/analytics-reports/scheduled'),
};
