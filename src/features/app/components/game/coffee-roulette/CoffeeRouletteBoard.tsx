/**
 * Coffee Roulette - Virtual Office Redesigned
 * Orchestrator Component
 * Main component that coordinates all phases and backend integration
 * 
 * Backend Integration:
 * - Listens to 'coffee:shuffle' â†’ shows matching animation
 * - Listens to 'coffee:start_chat' â†’ transitions to meeting room
 * - Listens to 'coffee:next_prompt' â†’ updates prompt display
 * - Listens to 'coffee:continue' â†’ resets prompt counter
 * - Listens to 'coffee:end' or 'coffee:end_and_finish' â†’ shows completion
 * 
 * Actions emitted:
 * - coffee:shuffle â†’ starts matching process
 * - coffee:start_chat â†’ begins chat phase (automatic after matching)
 * - coffee:next_prompt â†’ requests next conversation prompt
 * - coffee:continue â†’ user chooses to continue chatting
 * - coffee:end â†’ user ends session
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GAME_TYPES } from '@/features/app/pages/play/gameTypes';
import { RoomThemeProvider } from './theme/RoomThemeContext';
import { OfficeLobby } from './phases/OfficeLobby';
import { MeetingRoom } from './phases/MeetingRoom';
import { OfficeExitAnimation } from './phases/OfficeExitAnimation';
import { getThemeForPair } from './theme/roomThemes';
import type { ActivityFeedbackSource } from '@/features/app/api/activityFeedbacks';
import { useGameSnapshot } from '@/hooks/useGameSnapshot';
import { usePhaseEndTimer } from '@/hooks/usePhaseEndTimer';
import { useGameLoadingState } from '@/hooks/useGameLoadingState';
import type { BaseGameBoardProps } from '@/features/app/components/game/types';

type GamePhase = 'waiting' | 'matching' | 'chatting' | 'complete';

interface CoffeeSnapshot {
  kind: typeof GAME_TYPES.COFFEE_ROULETTE;
  phase: GamePhase;
  pairs: Array<{
    id: string;
    person1: { participantId: string; name: string; avatar: string; avatarUrl?: string | null };
    person2: { participantId: string; name: string; avatar: string; avatarUrl?: string | null };
    topic: string;
    topicKey?: string;
  }>;
  startedChatAt: string | null;
  chatEndsAt?: string;
  chatDurationMinutes?: number;
  promptsUsed?: number;
  decisionRequired?: boolean;
}

export interface CoffeeRouletteBoardProps extends BaseGameBoardProps {
  participants: any[];
  eventId?: string;
  onEmitAction: (actionType: string, payload?: any) => Promise<void>;
  gamesSocket?: any;
  onRequestActivityExitWithFeedback?: (source: ActivityFeedbackSource) => void;
}

export function CoffeeRouletteBoard({
  participants,
  currentUserId,
  sessionId,
  eventId,
  initialSnapshot,
  gameData,
  onEmitAction,
  gamesSocket,
  onRequestActivityExitWithFeedback,
}: CoffeeRouletteBoardProps) {
  const { t } = useTranslation();
  const snapshot = useGameSnapshot<CoffeeSnapshot>(
    gameData,
    initialSnapshot,
    (value): value is CoffeeSnapshot => !!value && typeof value === 'object' && (value as any).kind === GAME_TYPES.COFFEE_ROULETTE
  );

  // UI state
  const { isLoading, withLoading } = useGameLoadingState(false);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const capturedElapsedRef = useRef(0);
  const matchingAutoStartKeyRef = useRef<string | null>(null);

  // Phase state - snapshot is kept in sync by parent's GamePlay listener
  const phase = (snapshot?.phase || 'waiting') as GamePhase;
  const pairs = snapshot?.pairs || [];
  const myPair = pairs.find(
    (p) =>
      p.person1.participantId === currentUserId || p.person2.participantId === currentUserId
  ) || null;

  // Log whenever state changes
  useEffect(() => {
    console.log('[CoffeeRouletteBoard STATE UPDATE]', {
      phase,
      pairCount: pairs.length,
      myPairId: myPair?.id,
      myPair: myPair ? {
        person1: myPair.person1.participantId,
        person2: myPair.person2.participantId,
        topic: myPair.topic,
      } : null,
      currentUserId,
      sessionId,
      snapshotAvailable: !!snapshot,
      timestamp: new Date().toISOString(),
    });
  }, [phase, pairs, myPair, currentUserId, sessionId, snapshot]);

  // Chat state
  const chatEndsAt = snapshot?.chatEndsAt || null;
  const chatDurationMinutes = Math.max(1, Number(snapshot?.chatDurationMinutes || 30));
  const chatDurationSeconds = chatDurationMinutes * 60;
  const promptsUsed = snapshot?.promptsUsed || 0;
  const decisionRequired = !!snapshot?.decisionRequired;

  // Timer state
  const chatSecondsRemaining = usePhaseEndTimer(
    phase === 'chatting' ? chatEndsAt : null,
    chatDurationSeconds,
    phase === 'chatting'
  );
  const handleStartMatching = useCallback(async () => {
    try {
      console.log('[CoffeeRouletteBoard SHUFFLE] User clicked "Start Matching"', {
        currentUserId,
        sessionId,
        participantId: currentUserId,
        timestamp: new Date().toISOString(),
      });

      await withLoading(() => onEmitAction('coffee:shuffle'));

      console.log('[CoffeeRouletteBoard SHUFFLE] Shuffle action emitted successfully');
    } catch (error) {
      console.error('[CoffeeRouletteBoard SHUFFLE] Failed to start matching:', error);
    }
  }, [onEmitAction, withLoading, currentUserId, sessionId]);

  // Handle matching complete â†’ auto-start chat
  // Any paired participant can emit; backend is idempotent so duplicates are safe.
  // This ensures the other matched user gets the phase update even if they missed the broadcast.
  const handleMatchingComplete = useCallback(async () => {
    if (!myPair) return;

    try {
      await withLoading(() => onEmitAction('coffee:start_chat'));
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to start chat:', error);
    }
  }, [myPair, onEmitAction, withLoading]);

  // Matching phase should auto-advance: any paired participant can emit coffee:start_chat.
  // Fire once per pairing set per client (backend is idempotent).
  useEffect(() => {
    if (phase !== 'matching') return;
    const firstPairId = pairs[0]?.id;
    if (!firstPairId) return;
    if (matchingAutoStartKeyRef.current === firstPairId) return;
    matchingAutoStartKeyRef.current = firstPairId;
    void handleMatchingComplete();
  }, [phase, pairs, handleMatchingComplete]);

  // Handle next prompt
  const handleNextPrompt = useCallback(async () => {
    try {
      await withLoading(() =>
        Promise.race([
          onEmitAction('coffee:next_prompt', {
            // Stale-action guard: server ignores next_prompt if promptsUsed changed.
            expectedPromptsUsed: promptsUsed,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          ),
        ])
      );
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to get next prompt:', error);
    }
  }, [onEmitAction, promptsUsed, withLoading]);

  // Handle continue chatting
  const handleContinue = useCallback(async () => {
    try {
      await withLoading(() =>
        Promise.race([
          onEmitAction('coffee:continue', {
            // Stale-action guard: server ignores continue if promptsUsed changed.
            expectedPromptsUsed: promptsUsed,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          ),
        ])
      );
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to continue:', error);
    }
  }, [onEmitAction, promptsUsed, withLoading]);

  // Handle end session
  const handleEnd = useCallback(async () => {
    try {
      await withLoading(() =>
        Promise.race([
          onEmitAction('coffee:end'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          ),
        ])
      );
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to end session:', error);
    }
  }, [onEmitAction, withLoading]);

  // Handle reset (go back to waiting)
  const handleReset = useCallback(async () => {
    try {
      await withLoading(() => onEmitAction('coffee:reset'));
      setCurrentPairIndex(0);
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to reset:', error);
    }
  }, [onEmitAction, withLoading]);

  // Format participants for UI
  const formattedParticipants = useMemo(
    () =>
      participants.map((p) => ({
        participantId: p.id,
        name: p.name,
        avatar: (p.name || '??').slice(0, 2).toUpperCase(),
        avatarUrl: p.avatarUrl,
      })),
    [participants]
  );

  /** Merge pair person with latest participant data so avatar/name updates show instantly */
  const participantMap = useMemo(() => {
    const m = new Map<string, { name: string; avatarUrl?: string | null }>();
    for (const p of participants) {
      if (p?.id) {
        const avatarUrl =
          typeof (p as any).avatarUrl === 'string'
            ? (p as any).avatarUrl
            : (p as any).avatarUrl === null
              ? null
              : typeof (p as any).avatar_url === 'string'
                ? (p as any).avatar_url
                : typeof (p as any).avatar === 'string' && (p as any).avatar?.startsWith?.('http')
                  ? (p as any).avatar
                  : undefined;
        m.set(String(p.id), {
          name: typeof (p as any).name === 'string' ? (p as any).name : 'Unknown',
          avatarUrl,
        });
      }
    }
    return m;
  }, [participants]);

  const mergeWithLatestProfile = useCallback(
    (pairPerson: { participantId: string; name: string; avatar: string; avatarUrl?: string | null }) => {
      const latest = participantMap.get(pairPerson.participantId);
      if (!latest) return pairPerson;
      const name = latest.name || pairPerson.name;
      const avatarUrl = latest.avatarUrl !== undefined ? latest.avatarUrl : pairPerson.avatarUrl;
      return {
        ...pairPerson,
        name,
        avatar: (name || '??').slice(0, 2).toUpperCase(),
        avatarUrl: avatarUrl !== undefined ? avatarUrl : pairPerson.avatarUrl,
      };
    },
    [participantMap]
  );

  // Get theme for current pair
  const themeName = useMemo(() => {
    if (!myPair) return 'cozy';
    return getThemeForPair(myPair.id);
  }, [myPair]);

  // Determine current pair index
  useEffect(() => {
    if (phase === 'matching' || phase === 'chatting' || phase === 'complete') {
      if (myPair) {
        const index = pairs.findIndex((p) => p.id === myPair.id);
        setCurrentPairIndex(index + 1);
      }
    }
  }, [phase, myPair, pairs]);

  // PHASE: Waiting - Lobby
  if (phase === 'waiting') {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <RoomThemeProvider themeName={themeName}>
          <OfficeLobby
            participants={formattedParticipants}
            onStartMatching={handleStartMatching}
            isLoading={isLoading}
          />
        </RoomThemeProvider>
      </div>
    );
  }

  // PHASE: Matching - Simple smooth transition (no custom animation)
  if (phase === 'matching') {
    return (
      <RoomThemeProvider themeName={themeName}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center h-full min-h-0"
        >
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white/80 px-4 py-3 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-foreground">
              {t('gamePlay.coffeeRoulette.matching.matching', { defaultValue: 'Connecting you to your match...' })}
            </p>
          </div>
        </motion.div>
      </RoomThemeProvider>
    );
  }

  // PHASE: Chatting - Meeting Room
  if (phase === 'chatting' && myPair) {
    const isMyPerson1 = myPair.person1.participantId === currentUserId;
    const person1 = mergeWithLatestProfile(isMyPerson1 ? myPair.person1 : myPair.person2);
    const person2 = mergeWithLatestProfile(isMyPerson1 ? myPair.person2 : myPair.person1);

    const pairId = myPair.id;
    const isOfferer = isMyPerson1; // person1 in snapshot creates the offer
    const partnerParticipantId = isOfferer ? myPair.person2.participantId : myPair.person1.participantId;
    const topicText = myPair.topicKey
      ? t(myPair.topicKey, { defaultValue: myPair.topic })
      : myPair.topic;

    return (
      <RoomThemeProvider themeName={themeName}>
        <MeetingRoom
          person1={person1}
          person2={person2}
          topic={topicText}
          timeRemaining={chatSecondsRemaining}
          promptsUsed={promptsUsed}
          maxPrompts={6}
          decisionRequired={decisionRequired}
          sessionId={sessionId || undefined}
          eventId={eventId}
          pairId={pairId}
          myParticipantId={currentUserId}
          partnerParticipantId={partnerParticipantId}
          isOfferer={isOfferer}
          gamesSocket={gamesSocket}
          // Button visibility in MeetingRoom is derived from whether these handlers exist.
          // Backend uses `decisionRequired` to indicate the "max prompt reached" decision point.
          // So we only show "Next Topic" while normal prompting is active,
          // and only show "Continue" when the decision gate is active.
          onNextPrompt={!decisionRequired ? handleNextPrompt : undefined}
          onContinue={decisionRequired ? handleContinue : undefined}
          onEnd={decisionRequired ? handleEnd : undefined}
          isLoading={isLoading}
        />
      </RoomThemeProvider>
    );
  }

  // PHASE: Complete - Exit Animation
  if (phase === 'complete' && myPair) {
    const isMyPerson1 = myPair.person1.participantId === currentUserId;
    const person1 = mergeWithLatestProfile(isMyPerson1 ? myPair.person1 : myPair.person2);
    const person2 = mergeWithLatestProfile(isMyPerson1 ? myPair.person2 : myPair.person1);

    const elapsedSeconds = capturedElapsedRef.current || Math.max(0, chatDurationSeconds - chatSecondsRemaining);
    const topicText = myPair.topicKey
      ? t(myPair.topicKey, { defaultValue: myPair.topic })
      : myPair.topic;

    return (
      <RoomThemeProvider themeName={themeName}>
        <OfficeExitAnimation
          person1={person1}
          person2={person2}
          topic={topicText}
          duration={elapsedSeconds}
          promptsUsed={promptsUsed}
          onReset={handleReset}
          onExit={() => {
            onRequestActivityExitWithFeedback?.('activity_completed');
            void handleEnd();
          }}
          isLoading={isLoading}
        />
      </RoomThemeProvider>
    );
  }

  // Fallback - myPair not found (either waiting for shuffle, or odd one out)
  const isUnmatchedInRound = pairs.length > 0;
  return (
    <div className="flex items-center justify-center h-full min-h-0">
      <div className="text-center">
        <p className="text-lg font-semibold mb-4">
          {isUnmatchedInRound
            ? t('gamePlay.coffeeRoulette.unmatched', {
                defaultValue: "You weren't matched this round. Wait for the host to reshuffle for the next round.",
              })
            : t('gamePlay.coffeeRoulette.error.notFound', {
                defaultValue: 'Pair not found',
              })}
        </p>
        <p className="text-sm text-gray-600">Phase: {phase}</p>
      </div>
    </div>
  );
}

/**
 * Export for use in the application
 */
export { RoomThemeProvider };



