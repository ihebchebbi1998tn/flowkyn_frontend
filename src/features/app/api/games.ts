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
    api.post<GameSession>(`/events/${eventId}/game-sessions`, { game_type_id: gameTypeId }),

  /** Start the next round in a game session */
  startRound: (sessionId: string) =>
    api.post(`/game-sessions/${sessionId}/rounds`),

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
};
