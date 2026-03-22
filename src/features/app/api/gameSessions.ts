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
  getSessionDetails: (sessionId: string) => {
    console.log(`[gameSessionsApi] 🎮 getSessionDetails called with sessionId: ${sessionId}`);
    return api.get<SessionDetails>(`/game-sessions/${sessionId}/details`).then(
      (result) => {
        console.log(`[gameSessionsApi] ✅ getSessionDetails success for ${sessionId}:`, {
          participants: result.participants?.length || 0,
          messages: result.total_messages,
          actions: result.total_actions,
        });
        return result;
      },
      (error) => {
        console.error(`[gameSessionsApi] ❌ getSessionDetails failed for ${sessionId}:`, {
          error: error instanceof Error ? error.message : String(error),
          errorCode: error instanceof Error && 'code' in error ? (error as any).code : undefined,
        });
        throw error;
      }
    );
  },

  /**
   * Get paginated messages for a session
   */
  getSessionMessages: (sessionId: string, limit: number = 50, offset: number = 0) => {
    console.log(`[gameSessionsApi] 💬 getSessionMessages called:`, { sessionId, limit, offset });
    return api.get<{ messages: SessionMessage[]; total: number }>(`/game-sessions/${sessionId}/messages`, {
      limit: limit.toString(),
      offset: offset.toString(),
    }).then(
      (result) => {
        console.log(`[gameSessionsApi] ✅ getSessionMessages success:`, { count: result.messages?.length, total: result.total });
        return result;
      },
      (error) => {
        console.error(`[gameSessionsApi] ❌ getSessionMessages failed:`, error);
        throw error;
      }
    );
  },

  /**
   * Export session data as JSON or CSV
   * Returns file download
   */
  exportSessionData: (sessionId: string, format: 'json' | 'csv' = 'json') => {
    console.log(`[gameSessionsApi] 📥 exportSessionData called:`, { sessionId, format });
    return api.get(`/game-sessions/${sessionId}/export`, { format }).then(
      (result) => {
        console.log(`[gameSessionsApi] ✅ exportSessionData success`);
        return result;
      },
      (error) => {
        console.error(`[gameSessionsApi] ❌ exportSessionData failed:`, error);
        throw error;
      }
    );
  },

  /**
   * Close/finish a session
   */
  closeSession: (sessionId: string) => {
    console.log(`[gameSessionsApi] ⏹️ closeSession called for sessionId: ${sessionId}`);
    return api.post<{ success: boolean; message: string }>(`/game-sessions/${sessionId}/close`).then(
      (result) => {
        console.log(`[gameSessionsApi] ✅ closeSession success:`, result);
        return result;
      },
      (error) => {
        console.error(`[gameSessionsApi] ❌ closeSession failed:`, error);
        throw error;
      }
    );
  },

  /**
   * Delete a session (soft delete)
   */
  deleteSession: (sessionId: string) => {
    console.log(`[gameSessionsApi] 🗑️ deleteSession called for sessionId: ${sessionId}`);
    return api.del<{ success: boolean; message: string }>(`/game-sessions/${sessionId}`).then(
      (result) => {
        console.log(`[gameSessionsApi] ✅ deleteSession success:`, result);
        return result;
      },
      (error) => {
        console.error(`[gameSessionsApi] ❌ deleteSession failed:`, error);
        throw error;
      }
    );
  },

  /**
   * Get all active sessions for an event
   */
  getActiveSessionsForEvent: (eventId: string) => {
    console.log(`[gameSessionsApi] 📊 getActiveSessionsForEvent called for eventId: ${eventId}`);
    return api.get<ActiveSession[]>(`/events/${eventId}/game-sessions/active`).then(
      (result) => {
        console.log(`[gameSessionsApi] ✅ getActiveSessionsForEvent success:`, { count: result.length });
        return result;
      },
      (error) => {
        console.error(`[gameSessionsApi] ❌ getActiveSessionsForEvent failed:`, error);
        throw error;
      }
    );
  },
};
