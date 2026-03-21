/**
 * @fileoverview Game Session Details API
 *
 * Frontend API client for accessing game session details,
 * messages, and exporting session data.
 */

import { api } from './client';

export interface SessionParticipant {
  id: string;
  participant_id: string;
  display_name: string;
  avatar_url: string | null;
  participant_type: 'member' | 'guest';
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  interaction_count: number;
  message_count: number;
  action_count: number;
}

export interface SessionMessage {
  id: string;
  participant_id: string;
  participant_name: string;
  avatar_url: string | null;
  message: string;
  message_type: string;
  created_at: string;
  timestamp_minutes: number;
}

export interface SessionAction {
  id: string;
  participant_id: string;
  participant_name: string;
  round_number: number;
  action_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  timestamp_minutes: number;
}

export interface SessionTimeline {
  timestamp: string;
  event_type: 'participant_joined' | 'participant_left' | 'round_started' | 'round_ended' | 'action';
  participant_name?: string;
  round_number?: number;
  action_type?: string;
}

export interface SessionDetails {
  id: string;
  event_id: string;
  event_title: string;
  game_type_id: string;
  game_name: string;
  game_key: string;
  status: 'active' | 'paused' | 'finished';
  current_round: number;
  total_rounds: number;
  game_duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  session_deadline_at: string | null;
  total_participants: number;
  active_participants: number;
  completed_participants: number;
  total_messages: number;
  total_actions: number;
  total_rounds_completed: number;
  created_at: string;
  updated_at: string;
  participants: SessionParticipant[];
  messages: SessionMessage[];
  actions: SessionAction[];
  timeline: SessionTimeline[];
}

export interface ActiveSession {
  id: string;
  game_name: string;
  game_key: string;
  status: string;
  current_round: number;
  total_rounds: number;
  participant_count: number;
  started_at: string;
}

export const gameSessionsApi = {
  /**
   * Get comprehensive details for a game session
   */
  getSessionDetails: (sessionId: string) =>
    api.get<SessionDetails>(`/game-sessions/${sessionId}/details`),

  /**
   * Get paginated messages for a session
   */
  getSessionMessages: (sessionId: string, limit: number = 50, offset: number = 0) =>
    api.get<{ messages: SessionMessage[]; total: number }>(`/game-sessions/${sessionId}/messages`, {
      limit: limit.toString(),
      offset: offset.toString(),
    }),

  /**
   * Export session data as JSON or CSV
   * Returns file download
   */
  exportSessionData: (sessionId: string, format: 'json' | 'csv' = 'json') =>
    api.get(`/game-sessions/${sessionId}/export`, { format }),

  /**
   * Close/finish a session
   */
  closeSession: (sessionId: string) =>
    api.post<{ success: boolean; message: string }>(`/game-sessions/${sessionId}/close`),

  /**
   * Delete a session (soft delete)
   */
  deleteSession: (sessionId: string) =>
    api.del<{ success: boolean; message: string }>(`/game-sessions/${sessionId}`),

  /**
   * Get all active sessions for an event
   */
  getActiveSessionsForEvent: (eventId: string) =>
    api.get<ActiveSession[]>(`/events/${eventId}/game-sessions/active`),
};
