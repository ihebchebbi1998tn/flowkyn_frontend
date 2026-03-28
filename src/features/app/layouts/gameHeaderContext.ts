import { createContext, useContext } from 'react';
import type { GameParticipant } from '@/features/app/components/game/shell/types';

export type GameHeaderState = {
  title: string;
  subtitle: string;
  gameType: 'sync' | 'async';
  eventId: string;
  participants: GameParticipant[];
  onEnd: () => void;
  currentUserName?: string;
  currentUserAvatarUrl?: string | null;
  onEditProfile?: () => void;
  organizationLogo?: string;
  organizationName?: string;
  disconnectedBadgeCount?: number;
  hideBackButton?: boolean;
  sessionStartedAt?: string | null;
};

type GameHeaderContextValue = {
  header: GameHeaderState | null;
  setHeader: (v: GameHeaderState | null) => void;
};

export const GameHeaderContext = createContext<GameHeaderContextValue | null>(null);

export function useSetGameHeader() {
  const ctx = useContext(GameHeaderContext);
  if (!ctx) throw new Error('useSetGameHeader must be used within FocusedLayout');
  return ctx.setHeader;
}

