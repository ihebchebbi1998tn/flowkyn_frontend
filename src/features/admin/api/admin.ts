/**
 * Admin API module — Flowkyn platform management endpoints.
 * These endpoints are only accessible by super-admin users (Flowkyn owners).
 * 
 * Uses the dedicated admin API client (adminClient) which points to
 * api.flowkyn.com/v1 and uses admin-specific JWT tokens.
 */
import { adminClient } from './client';
import type { PaginatedResponse, User, Organization, GameSession } from '@/types';

export interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalGameSessions: number;
  activeUsers30d: number;
  newUsersToday: number;
  newOrgsToday: number;
  sessionsByGame?: {
    twoTruths: number;
    coffeeRoulette: number;
    winsOfWeek: number;
    strategicEscape: number;
    trivia: number;
    scavengerHunt: number;
    gratitude: number;
  };
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  metadata: Record<string, unknown>;
  organization_id?: string;
  organization_name?: string;
  created_at: string;
}

export interface ContactEntry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export interface EarlyAccessEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface EarlyAccessProvisionResult {
  requestId: string;
  userId: string;
  email: string;
  createdNewAccount: boolean;
  passwordResetApplied: boolean;
  temporaryPassword: string | null;
  loginUrl: string;
}

export interface BugReportEntry {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  title: string;
  description: string;
  type: 'bug_report' | 'feature_request' | 'issue' | 'general_feedback';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
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
  uploaded_by_email?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  created_at: string;
}

export interface BugReportHistoryEntry {
  id: string;
  bug_report_id: string;
  changed_by_user_id?: string | null;
  user_name?: string;
  user_email?: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  change_type: string;
  created_at: string;
}

export interface BugReportStats {
  totalReports: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  criticalCount: number;
  averageResolutionTime: string;
}

export const adminApi = {
  // Dashboard stats
  getStats: () =>
    adminClient.get<AdminStats>('/admin/stats'),

  // Users management
  listUsers: (page = 1, limit = 20, search?: string) =>
    adminClient.get<PaginatedResponse<User>>('/admin/users', {
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
    }),

  getUserById: (id: string) =>
    adminClient.get<User>(`/admin/users/${id}`),

  updateUser: (id: string, data: Partial<User>) =>
    adminClient.patch<User>(`/admin/users/${id}`, data),

  suspendUser: (id: string) =>
    adminClient.post(`/admin/users/${id}/suspend`),

  unsuspendUser: (id: string) =>
    adminClient.post(`/admin/users/${id}/unsuspend`),

  deleteUser: (id: string) =>
    adminClient.del(`/admin/users/${id}`),

  // Organizations management
  listOrganizations: (page = 1, limit = 20, search?: string) =>
    adminClient.get<PaginatedResponse<Organization>>('/admin/organizations', {
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
    }),

  getOrganization: (id: string) =>
    adminClient.get<Organization>(`/admin/organizations/${id}`),

  updateOrganization: (id: string, data: Partial<Organization>) =>
    adminClient.patch<Organization>(`/admin/organizations/${id}`, data),

  deleteOrganization: (id: string) =>
    adminClient.del(`/admin/organizations/${id}`),

  // Game sessions
  listGameSessions: (page = 1, limit = 20) =>
    adminClient.get<PaginatedResponse<GameSession>>('/admin/game-sessions', {
      page: String(page),
      limit: String(limit),
    }),

  // Audit logs (platform-wide)
  listAuditLogs: (page = 1, limit = 50, filters?: { userId?: string; action?: string }) =>
    adminClient.get<PaginatedResponse<AuditLogEntry>>('/admin/audit-logs', {
      page: String(page),
      limit: String(limit),
      ...(filters?.userId ? { user_id: filters.userId } : {}),
      ...(filters?.action ? { action: filters.action } : {}),
    }),

  // Contact submissions
  listContacts: (page = 1, limit = 20, status?: string) =>
    adminClient.get<PaginatedResponse<ContactEntry>>('/admin/contact', {
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
    }),

  getContact: (id: string) =>
    adminClient.get<ContactEntry>(`/admin/contact/${id}`),

  updateContactStatus: (id: string, status: string) =>
    adminClient.patch(`/admin/contact/${id}`, { status }),

  deleteContact: (id: string) =>
    adminClient.del(`/admin/contact/${id}`),

  // Early access submissions
  listEarlyAccess: (page = 1, limit = 20) =>
    adminClient.get<PaginatedResponse<EarlyAccessEntry>>('/admin/early-access', {
      page: String(page),
      limit: String(limit),
    }),

  sendEarlyAccessCredentials: (id: string, personalizedMessage: string, resetPasswordIfExists = true) =>
    adminClient.post<{ message: string; data: EarlyAccessProvisionResult }>(
      `/admin/early-access/${id}/send-credentials`,
      { personalizedMessage, resetPasswordIfExists }
    ),

  // Bug Reports / Ticket System
  listBugReports: (page = 1, limit = 20, filters?: { status?: string; priority?: string; type?: string; search?: string }) =>
    adminClient.get<PaginatedResponse<BugReportEntry>>('/bug-reports', {
      page: String(page),
      limit: String(limit),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.priority ? { priority: filters.priority } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.search ? { search: filters.search } : {}),
    }),

  getBugReport: (id: string) =>
    adminClient.get<{
      data: BugReportEntry;
      attachments: BugReportAttachment[];
      history: BugReportHistoryEntry[];
    }>(`/bug-reports/${id}`),

  updateBugReport: (id: string, data: { status?: string; priority?: string; assignedToUserId?: string | null; resolutionNotes?: string }) =>
    adminClient.patch<BugReportEntry>(`/bug-reports/${id}`, data),

  deleteBugReport: (id: string) =>
    adminClient.del(`/bug-reports/${id}`),

  getBugReportStats: () =>
    adminClient.get<{ data: BugReportStats }>('/bug-reports/admin/stats'),

  getBugReportHistory: (id: string) =>
    adminClient.get<{ data: BugReportHistoryEntry[] }>(`/bug-reports/${id}/history`),

  deleteAttachment: (reportId: string, attachmentId: string) =>
    adminClient.del(`/bug-reports/${reportId}/attachments/${attachmentId}`),

  // System — /health is at root level, not under /v1
  getSystemHealth: async () => {
    const baseUrl = import.meta.env.VITE_ADMIN_API_URL || 'https://api.flowkyn.com/v1';
    const healthUrl = baseUrl.replace(/\/v1$/, '/health');
    const res = await fetch(healthUrl);
    return res.json() as Promise<{ status: string; database: string; timestamp: string }>;
  },
};
