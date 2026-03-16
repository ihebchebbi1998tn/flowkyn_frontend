/**
 * @fileoverview Bug Reports / Ticketing System API Module
 *
 * Users can submit bug reports, feature requests, and issues.
 * Admins can view and manage all tickets via admin panel.
 *
 * @see /flowkyn_backend/src/routes/bugReports.routes.ts
 */

import { api } from './client';
import type { PaginatedResponse } from '@/types';

/** Bug Report type */
export type BugReportType = 'bug_report' | 'feature_request' | 'issue' | 'general_feedback';
export type BugReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface BugReport {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  title: string;
  description: string;
  type: BugReportType;
  priority: BugReportPriority;
  status: BugReportStatus;
  assigned_to_user_id?: string | null;
  assigned_to_name?: string;
  assigned_to_email?: string;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  attachment_count?: number;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export interface BugReportAttachment {
  id: string;
  bug_report_id: string;
  uploaded_by_user_id: string;
  uploaded_by_name?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  created_at: string;
}

export interface BugReportHistory {
  id: string;
  bug_report_id: string;
  changed_by_user_id?: string | null;
  user_name?: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  change_type: string;
  created_at: string;
}

export const bugReportsApi = {
  /** Create a new bug report / ticket */
  create: (data: { title: string; description: string; type: BugReportType; priority?: BugReportPriority }) =>
    api.post<{ message: string; data: BugReport }>('/bug-reports', data),

  /** List user's bug reports */
  list: (page = 1, limit = 20, filters?: { status?: BugReportStatus; priority?: BugReportPriority; type?: BugReportType; search?: string }) => {
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.priority ? { priority: filters.priority } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.search ? { search: filters.search } : {}),
    });
    return api.get<PaginatedResponse<BugReport>>(`/bug-reports?${queryParams.toString()}`);
  },

  /** List bug reports with advanced options (for admin and users) */
  listAdvanced: (options?: {
    page?: number;
    limit?: number;
    status?: BugReportStatus;
    priority?: BugReportPriority;
    type?: BugReportType;
    search?: string;
    assignedTo?: string;
  }) => {
    const queryParams = new URLSearchParams({
      page: String(options?.page || 1),
      limit: String(options?.limit || 20),
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.priority ? { priority: options.priority } : {}),
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.search ? { search: options.search } : {}),
      ...(options?.assignedTo ? { assignedTo: options.assignedTo } : {}),
    });
    return api.get<PaginatedResponse<BugReport>>(`/bug-reports?${queryParams.toString()}`);
  },

  /** Get single bug report with attachments and history */
  getById: (id: string) =>
    api.get<{ data: BugReport; attachments: BugReportAttachment[]; history: BugReportHistory[] }>(`/bug-reports/${id}`),

  /** Update bug report (admin only) */
  update: (id: string, data: { status?: BugReportStatus; priority?: BugReportPriority; assignedToUserId?: string | null; resolutionNotes?: string }) =>
    api.patch<{ message: string; data: BugReport }>(`/bug-reports/${id}`, data),

  /** Delete bug report */
  delete: (id: string) =>
    api.del(`/bug-reports/${id}`),

  /** Upload attachment to bug report */
  uploadAttachment: (bugReportId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ message: string; data: { id: string } }>(`/bug-reports/${bugReportId}/attachments`, formData);
  },

  /** Add attachment using formData (for multiple files) */
  addAttachment: (bugReportId: string, formData: FormData) =>
    api.post<{ message: string; data: BugReportAttachment }>(`/bug-reports/${bugReportId}/attachments`, formData),

  /** Delete attachment from bug report */
  deleteAttachment: (bugReportId: string, attachmentId: string) =>
    api.del(`/bug-reports/${bugReportId}/attachments/${attachmentId}`),

  /** Get bug report statistics (admin only) */
  getStats: () =>
    api.get<{ data: { totalReports: number; openCount: number; inProgressCount: number; resolvedCount: number; closedCount: number; criticalCount: number; averageResolutionTime: string } }>('/bug-reports/admin/stats'),
};
