import { api } from '@/features/app/api/client';

export interface ContentModerationItem {
  id: string;
  content_id: string;
  content_type: string;
  flagged_by: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  moderated_by?: string;
  moderation_notes?: string;
  moderated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  archived: number;
  averageProcessingTimeHours: number;
}

export const contentModerationApi = {
  list: (status?: string, contentType?: string, page = 1, limit = 20) =>
    api.get<{ data: ContentModerationItem[]; total: number }>('/admin/content-moderation', {
      status: status || '',
      contentType: contentType || '',
      page: String(page),
      limit: String(limit),
    }),

  get: (id: string) =>
    api.get<ContentModerationItem>(`/admin/content-moderation/${id}`),

  flag: (data: { contentId: string; contentType: string; reason: string; description?: string }) =>
    api.post<ContentModerationItem>('/admin/content-moderation', data),

  approve: (id: string, notes?: string) =>
    api.post<ContentModerationItem>(`/admin/content-moderation/${id}/approve`, { notes }),

  reject: (id: string, notes?: string) =>
    api.post<ContentModerationItem>(`/admin/content-moderation/${id}/reject`, { notes }),

  archive: (id: string) =>
    api.post<ContentModerationItem>(`/admin/content-moderation/${id}/archive`),

  getStats: () =>
    api.get<ModerationStats>('/admin/content-moderation/stats'),

  getOverdue: (hours = 24) =>
    api.get<ContentModerationItem[]>('/admin/content-moderation/overdue', {
      hours: String(hours),
    }),

  bulkApprove: (itemIds: string[]) =>
    api.post(`/admin/content-moderation/bulk/approve`, { itemIds }),

  bulkReject: (itemIds: string[]) =>
    api.post(`/admin/content-moderation/bulk/reject`, { itemIds }),
};
