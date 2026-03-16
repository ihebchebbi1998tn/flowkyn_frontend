/**
 * @fileoverview Organizations API Module
 *
 * Manages organization lifecycle:
 * - CRUD operations (create, get, update)
 * - Member management (list, invite, accept, remove)
 * - Logo upload via multipart/form-data
 *
 * Organizations are the top-level grouping entity.
 * Every user belongs to at least one org (created during onboarding).
 *
 * @see NodejsBackend/src/routes/organizations.routes.ts
 */

import { api } from './client';
import type { Organization, OrgMember } from '@/types';

export const organizationsApi = {
  /**
   * Create a new organization.
   * The creating user automatically becomes the owner with a free plan.
   */
  create: (data: { name: string; description?: string; industry?: string; company_size?: string; goals?: string[] }) =>
    api.post<Organization>('/organizations', data),

  /** Get the current user's primary organization */
  getCurrent: () =>
    api.get<Organization>('/organizations/current'),

  /** Get organization details by ID */
  getById: (orgId: string) =>
    api.get<Organization>(`/organizations/${orgId}`),

  /** Update organization details */
  update: (orgId: string, data: { name?: string; description?: string; industry?: string; company_size?: string; goals?: string[] }) =>
    api.patch<Organization>(`/organizations/${orgId}`, data),

  /** List active members with their roles */
  listMembers: (orgId: string) =>
    api.get<OrgMember[]>(`/organizations/${orgId}/members`),

  /** List pending/previous invitations for an organization */
  listInvitations: (orgId: string) =>
    api.get<Array<{ id: string; email: string; status: string; created_at: string; expires_at: string }>>(
      `/organizations/${orgId}/invitations`
    ),

  /** Combined view of active members and pending invitations */
  listPeople: (orgId: string) =>
    api.get<{
      members: OrgMember[];
      invitations: Array<{ id: string; email: string; status: string; created_at: string; expires_at: string }>;
    }>(`/organizations/${orgId}/people`),

  /**
   * Send an invitation email to join the organization.
   * @param roleId - The role ID to assign (admin, member, moderator)
   */
  inviteMember: (orgId: string, email: string, roleId: string, lang?: string) =>
    api.post<{ message: string }>(`/organizations/${orgId}/invitations`, { email, role_id: roleId, lang }),

  /**
   * Accept an organization invitation using its token.
   * The invitation link format is: /invite/{token}?type=org
   */
  acceptInvitation: (token: string) =>
    api.post<{ message: string }>('/organizations/invitations/accept', { token }),

  /** Remove a member from the organization */
  removeMember: (orgId: string, memberId: string) =>
    api.del(`/organizations/${orgId}/members/${memberId}`),

  /**
   * Upload an organization logo.
   * Accepts JPEG, PNG, GIF, WebP via multipart/form-data.
   */
  uploadLogo: (orgId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.upload<Organization>(`/organizations/${orgId}/logo`, formData);
  },
};
