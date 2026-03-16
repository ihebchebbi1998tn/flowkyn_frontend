/**
 * @fileoverview Notifications API Module
 *
 * Manages user notifications:
 * - List paginated notifications (newest first)
 * - Mark individual notifications as read
 *
 * Notifications are generated server-side from events like:
 * - Event invitations
 * - Game session updates
 * - Organization changes
 *
 * @see NodejsBackend/src/routes/notifications.routes.ts
 */

import { api } from './client';
import type { Notification, PaginatedResponse } from '@/types';

export const notificationsApi = {
  /** List notifications for the current user (paginated, newest first) */
  list: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { page: String(page), limit: String(limit) }),

  /** Mark a single notification as read */
  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}`),
};
