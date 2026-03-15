/**
 * @fileoverview Games API Module
 *
 * Manages game sessions within events:
 * - Game type catalog (Two Truths, Coffee Roulette, etc.)
 * - Session lifecycle (start → rounds → actions → finish)
 * - Real-time game actions submitted via REST (complemented by WebSocket events)
 *
 * Game routes are mounted at the root level (not under /events)
 * because some operate on session IDs directly.
 *
 * @see NodejsBackend/src/routes/games.routes.ts
 */

import { api } from './client';
import type { GameType, GameSession } from '@/types';

export const gamesApi = {
  /** List all available game types (cached for 30 min client-side) */
  listTypes: () =>
    api.get<GameType[]>('/game-types'),

  /** Start a new game session within an event */
  startSession: (eventId: string, gameTypeId: string) =>
    api.post<GameSession>(`/events/${eventId}/game-sessions`, { game_type_id: gameTypeId }, eventId),

  /**
   * Strategic Escape Challenge — create a configured session for an event.
   * Only owners/admins/moderators can call this.
   */
  createStrategicSession: (eventId: string, config: {
    industry: string;
    crisisType: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) =>
    api.post<{ sessionId: string; eventId: string; config: typeof config }>(
      `/events/${eventId}/strategic-sessions`,
      config,
      eventId
    ),

  /**
   * Resolve the currently active game session for a given event + game type key.
   * Returns null if no active session exists.
   */
  getActiveSession: (eventId: string, gameKey: string) =>
    api.get<GameSession | null>(`/events/${eventId}/game-sessions/active`, { game_key: gameKey }, eventId),

  /** Start the next round in a game session */
  startRound: (sessionId: string) =>
    api.post(`/game-sessions/${sessionId}/rounds`),

  /**
   * Strategic Escape Challenge — assign roles for a configured session
   * and trigger localized secret-role emails.
   */
  assignStrategicRoles: (sessionId: string) =>
    api.post<{ assignments: Array<{ participantId: string; roleKey: string }> }>(
      `/strategic-sessions/${sessionId}/assign-roles`
    ),

  /**
   * Strategic Escape Challenge — get the current caller's role for a session.
   * Supports both authenticated members and guests.
   */
  getMyStrategicRole: (sessionId: string, eventId?: string) =>
    api.get<{ roleKey: string } | null>(
      `/strategic-sessions/${sessionId}/roles/me`,
      undefined,
      eventId
    ),

  /**
   * Submit a game action (vote, answer, etc.)
   * Participant ownership is verified server-side.
   */
  submitAction: (data: {
    game_session_id: string;
    round_id: string;
    participant_id: string;
    action_type: string;
    payload: Record<string, unknown>;
  }) =>
    api.post('/game-actions', data),

  /** Finish a game session and compute results/rankings */
  finishSession: (sessionId: string) =>
    api.post(`/game-sessions/${sessionId}/finish`),

  /** List prompts for a given game type (for icebreakers) */
  getPrompts: (gameTypeId: string, category?: string) =>
    api.get<Array<{
      id: string;
      game_type_id: string;
      text: string;
      category?: string | null;
    }>>(`/game-types/${gameTypeId}/prompts`, category ? { category } : undefined),
};
