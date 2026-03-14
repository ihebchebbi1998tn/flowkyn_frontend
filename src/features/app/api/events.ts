/**
 * @fileoverview Events API Module
 *
 * Complete event lifecycle management:
 * - CRUD operations (list, create, update, delete)
 * - Public info & lobby endpoints (no auth required)
 * - Invitation flow (send, validate, accept)
 * - Participant management (join, leave, guest join)
 * - Real-time messaging (messages, posts)
 *
 * Public endpoints (no auth): getPublicInfo, validateToken, joinAsGuest, getParticipants
 * Authenticated endpoints: everything else
 *
 * @see NodejsBackend/src/routes/events.routes.ts for route definitions
 */

import { api } from './client';
import type { FlowkynEvent, PaginatedResponse } from '@/types';

export const eventsApi = {
  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** List events for the authenticated user, optionally filtered by org */
  list: (page = 1, limit = 10, orgId?: string) =>
    api.get<PaginatedResponse<FlowkynEvent>>('/events', {
      page: String(page), limit: String(limit),
      ...(orgId ? { organization_id: orgId } : {}),
    }),

  /** Get full event details (auth required, private events need org membership) */
  getById: (eventId: string) =>
    api.get<FlowkynEvent>(`/events/${eventId}`),

  /** Create a new event under an organization */
  create: (data: {
    organization_id: string; title: string; description?: string;
    event_mode?: string; visibility?: string; max_participants?: number;
    start_time?: string; end_time?: string; invites?: string[];
  }) =>
    api.post<FlowkynEvent>('/events', data),

  /** Update event fields (requires admin/moderator role or event creator) */
  update: (eventId: string, data: Partial<FlowkynEvent>) =>
    api.put<FlowkynEvent>(`/events/${eventId}`, data),

  /** Delete event and all related data (requires owner/admin role) */
  delete: (eventId: string) =>
    api.del(`/events/${eventId}`),

  // ── Public Endpoints (no auth) ────────────────────────────────────────────

  /** Public event info for lobby display — no auth required */
  getPublicInfo: (eventId: string) =>
    api.get<{
      id: string; title: string; description: string; event_mode: string;
      visibility: string; max_participants: number; start_time: string;
      end_time: string; status: string; allow_guests: boolean;
      organization_name: string; organization_logo: string | null;
      participant_count: number; invited_count?: number;
    }>(`/events/${eventId}/public`),

  /** Validate an invitation token — no auth required */
  validateToken: (eventId: string, token: string) =>
    api.get<{
      id: string; email: string; status: string; expires_at: string;
      event_title: string; event_description: string; event_mode: string;
      event_status: string; organization_name: string;
    }>(`/events/${eventId}/validate-token`, { token }),

  /** Join as guest — no auth required */
  joinAsGuest: (eventId: string, data: { name: string; email?: string; avatar_url?: string; token?: string }) =>
    api.post<{ participant_id: string; guest_name: string; guest_token: string }>(
      `/events/${eventId}/join-guest`, data
    ),

  /** List participants (for lobby) — no auth required */
  getParticipants: (eventId: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<{
      id: string; type: string; name: string;
      avatar: string | null; email: string | null; joined_at: string;
    }>>(`/events/${eventId}/participants`, {
      page: String(page), limit: String(limit),
    }),

  // ── Invitations ───────────────────────────────────────────────────────────

  /** Send invitation email to a participant */
  invite: (eventId: string, email: string, lang?: string) =>
    api.post<{ message: string }>(`/events/${eventId}/invitations`, { email, lang }),

  /** Accept an invitation (logged-in user) */
  acceptInvitation: (eventId: string, token: string) =>
    api.post<{ participant_id: string; already_joined: boolean }>(
      `/events/${eventId}/accept-invitation`, { token }
    ),

  // ── Participation ─────────────────────────────────────────────────────────

  /** Join event as authenticated org member */
  join: (eventId: string) =>
    api.post(`/events/${eventId}/join`),

  /** Leave event */
  leave: (eventId: string) =>
    api.post(`/events/${eventId}/leave`),

  // ── Messages ──────────────────────────────────────────────────────────────

  /** Get paginated chat messages */
  getMessages: (eventId: string, page = 1, limit = 50) =>
    api.get(`/events/${eventId}/messages`, { page: String(page), limit: String(limit) }, eventId),

  /** Get paginated activity posts for async games like Wins of the Week */
  getPosts: (eventId: string, page = 1, limit = 50) =>
    api.get<PaginatedResponse<{
      id: string;
      event_id: string;
      author_participant_id: string;
      content: string;
      created_at: string;
      author_name: string;
      author_avatar: string | null;
      reactions: { type: string; count: number; reacted?: boolean }[];
    }>>(`/events/${eventId}/posts`, {
      page: String(page),
      limit: String(limit),
    }, eventId),

  /** Send a chat message */
  sendMessage: (eventId: string, participantId: string, message: string) =>
    api.post(`/events/${eventId}/messages`, { participant_id: participantId, message }, eventId),

  // ── Posts ──────────────────────────────────────────────────────────────────

  /** Create an activity post */
  createPost: (eventId: string, participantId: string, content: string) =>
    api.post(`/events/${eventId}/posts`, { participant_id: participantId, content }, eventId),

  // ── Identity helpers ────────────────────────────────────────────────────────

  /** Get the current participant identity (member or guest) for this event */
  getMyParticipant: (eventId: string) =>
    api.get<{
      id: string;
      type: string;
      name: string | null;
      avatar: string | null;
      isGuest: boolean;
    }>(`/events/${eventId}/me`, undefined, eventId),

  /** Get the current user's per-event profile (display name + avatar) */
  getMyProfile: (eventId: string) =>
    api.get<{
      participant_id: string;
      id: string | null;
      display_name: string;
      avatar_url: string | null;
    }>(`/events/${eventId}/profile`, undefined, eventId),

  /** Upsert the current user's per-event profile */
  upsertMyProfile: (eventId: string, payload: { display_name: string; avatar_url?: string | null }) =>
    api.put(`/events/${eventId}/profile`, payload, eventId),

  /** Get the currently pinned chat message for an event (if any) — public, no auth */
  getPinnedMessage: (eventId: string) =>
    api.get<{
      id: string;
      event_id: string;
      participant_id: string;
      message: string;
      created_at: string;
      user_id?: string | null;
      user_name?: string | null;
      avatar_url?: string | null;
    } | null>(`/events/${eventId}/pinned-message`),

  /** Pin a chat message (host/admin only) */
  pinMessage: (eventId: string, messageId: string) =>
    api.post<void>(`/events/${eventId}/pin-message`, { message_id: messageId }, eventId),

  /** Unpin the current chat message (host/admin only) */
  unpinMessage: (eventId: string) =>
    api.del<void>(`/events/${eventId}/pin-message`, eventId),
};
