/**
 * Shared socket & game data types
 * Single source of truth for socket payloads used across the app.
 */

/** Generic events socket interface (subset used by game components) */
export interface EventsSocketLike {
  isConnected: boolean;
  on: (event: string, handler: (...args: unknown[]) => void) => (() => void) | void;
}

/** Generic games socket interface */
export interface GamesSocketLike {
  isConnected: boolean;
  socket: { id?: string } | null;
  emit: <T = unknown>(event: string, data?: unknown) => Promise<T | void>;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
}

/** Participant as returned by the backend */
export interface GameParticipantRecord {
  id: string;
  name: string;
  avatar: string | null;
  avatarUrl?: string | null;
}

/** Chat message from events socket */
export interface ChatMessagePayload {
  id?: string;
  participantId: string;
  message: string;
  senderName?: string;
}

/** Event notification from events socket */
export interface EventNotificationPayload {
  type: string;
  payload?: {
    sessionId?: string;
    [key: string]: unknown;
  };
}

/** Game data broadcast from games socket */
export interface GameDataPayload {
  sessionId: string;
  gameData: unknown;
}

/** Raw post from API */
export interface RawPost {
  id: string;
  author_name: string;
  author_avatar?: string | null;
  content: string;
  created_at: string;
  parent_post_id?: string | null;
  reactions?: Array<{
    type: string;
    count: number;
    reacted?: boolean;
  }>;
}
