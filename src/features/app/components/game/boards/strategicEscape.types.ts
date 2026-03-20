import type { GameParticipant } from '../shell';
import type { BaseGameBoardProps } from '../types';

export type StrategicPhase = 'setup' | 'roles_assignment' | 'discussion' | 'debrief';

export interface StrategicEscapeSnapshot {
  kind: 'strategic-escape';
  phase: StrategicPhase;
  industryKey?: string | null;
  crisisKey?: string | null;
  difficultyKey?: 'easy' | 'medium' | 'hard' | string | null;
  industryLabel?: string | null;
  crisisLabel?: string | null;
  difficultyLabel?: string | null;
  // Legacy fallbacks (older snapshots)
  industry?: string | null;
  crisisType?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | string | null;
  rolesAssigned?: boolean;
  discussionEndsAt?: string | null;
}

export interface StrategicEscapeBoardProps extends BaseGameBoardProps {
  participants: GameParticipant[];
  currentUserName?: string;
  currentUserAvatar: string;
  currentUserAvatarUrl?: string | null;
  eventId: string;
  onSessionCreated: (sessionId: string) => void;
  onEmitSocketAction: (
    actionType: string,
    payload?: unknown,
    opts?: { sessionId?: string },
  ) => Promise<void>;
}

export function isStrategicEscapeSnapshot(value: unknown): value is StrategicEscapeSnapshot {
  if (!value || typeof value !== 'object') return false;
  return (value as Record<string, unknown>).kind === 'strategic-escape';
}
