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

  // System — /health is at root level, not under /v1
  getSystemHealth: async () => {
    const baseUrl = import.meta.env.VITE_ADMIN_API_URL || 'https://api.flowkyn.com/v1';
    const healthUrl = baseUrl.replace(/\/v1$/, '/health');
    const res = await fetch(healthUrl);
    return res.json() as Promise<{ status: string; database: string; timestamp: string }>;
  },
};
