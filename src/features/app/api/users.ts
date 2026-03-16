/**
 * @fileoverview Users API Module
 *
 * User profile and directory operations:
 * - Current user profile (me)
 * - Profile updates (name, language)
 * - Avatar upload (multipart/form-data)
 * - User directory listing (paginated)
 * - Onboarding team invitations
 *
 * @see NodejsBackend/src/routes/users.routes.ts
 */

import { api } from './client';
import type { User, PaginatedResponse } from '@/types';

export const usersApi = {
  /** Get the authenticated user's profile */
  me: () =>
    api.get<User>('/users/me'),

  /** Update profile fields (name, language) */
  updateProfile: (data: { name?: string; language?: string }) =>
    api.patch<User>('/users/me', data),

  /**
   * Upload a new avatar image.
   * Accepts common image formats via multipart/form-data.
   * Returns the new avatar URL.
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.upload<{ avatar_url: string }>('/users/avatar', formData);
  },

  /** Change the authenticated user's password */
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  /** Send team invitations during onboarding */
  sendOnboardingInvites: (orgId: string, invites: Array<{ email: string }>, lang?: string) =>
    api.post<{ success: string[]; failed: Array<{ email: string; reason: string }> }>('/users/onboarding-invites', {
      orgId,
      invites,
      lang,
    }),

  /** List users in the directory (paginated) */
  list: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<User>>('/users', { page: String(page), limit: String(limit) }),

  /** Get a specific user's profile by ID */
  getById: (id: string) =>
    api.get<User>(`/users/${id}`),
};
