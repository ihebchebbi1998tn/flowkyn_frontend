/**
 * Coffee Roulette - Virtual Office Redesigned
 * Orchestrator Component
 * Main component that coordinates all phases and backend integration
 * 
 * Backend Integration:
 * - Listens to 'coffee:shuffle' → shows matching animation
 * - Listens to 'coffee:start_chat' → transitions to meeting room
 * - Listens to 'coffee:next_prompt' → updates prompt display
 * - Listens to 'coffee:continue' → resets prompt counter
 * - Listens to 'coffee:end' or 'coffee:end_and_finish' → shows completion
 * 
 * Actions emitted:
 * - coffee:shuffle → starts matching process
 * - coffee:start_chat → begins chat phase (automatic after matching)
 * - coffee:next_prompt → requests next conversation prompt
 * - coffee:continue → user chooses to continue chatting
 * - coffee:end → user ends session
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
  promptsUsed?: number;
  decisionRequired?: boolean;
}

interface CoffeeRouletteBoardProps {
  participants: any[];
  currentUserId: string;
  sessionId?: string | null;
  eventId?: string;
  initialSnapshot?: any;
  gameData?: any;
  onEmitAction: (actionType: string, payload?: any) => Promise<void>;
  gamesSocket?: any; // Socket dfor listening to real-time updates
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
  const snapshot: CoffeeSnapshot | null = (gameData?.kind === GAME_TYPES.COFFEE_ROULETTE
    ? gameData
    : initialSnapshot?.kind === GAME_TYPES.COFFEE_ROULETTE
    ? initialSnapshot
    : null) as any;

  // Phase state
  const phase = (snapshot?.phase || 'waiting') as GamePhase;
  const pairs = snapshot?.pairs || [];
  const myPair = pairs.find(
    (p) =>
      p.person1.participantId === currentUserId || p.person2.participantId === currentUserId
  ) || null;

  // Chat state
  const chatEndsAt = snapshot?.chatEndsAt || null;
  const promptsUsed = snapshot?.promptsUsed || 0;
  const decisionRequired = !!snapshot?.decisionRequired;

  // Timer state
  const [chatSecondsRemaining, setChatSecondsRemaining] = useState(() => {
    if (chatEndsAt) {
      return Math.max(0, Math.ceil((new Date(chatEndsAt).getTime() - Date.now()) / 1000));
    }
    return 30 * 60; // 30 minutes default
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const capturedElapsedRef = useRef(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const matchingAutoStartKeyRef = useRef<string | null>(null);

  // Listen for real-time socket events from other players
  useEffect(() => {
    if (!gamesSocket?.on) return;

    const unsubShuffle = gamesSocket.on('game:state', (payload: any) => {
      const snap = payload?.state?.snapshot;
      if (snap?.kind === GAME_TYPES.COFFEE_ROULETTE) {
        console.log('[CoffeeRouletteBoard] Received game:state update:', {
          phase: snap.phase,
          pairsCount: snap.pairs?.length,
        });
      }
    });

    const unsubData = gamesSocket.on('game:data', (payload: any) => {
      if (payload?.gameData?.kind === GAME_TYPES.COFFEE_ROULETTE) {
        console.log('[CoffeeRouletteBoard] Received game:data update:', {
          phase: payload.gameData.phase,
          pairsCount: payload.gameData.pairs?.length,
        });
      }
    });

    return () => {
      unsubShuffle?.();
      unsubData?.();
    };
  }, [gamesSocket]);

  // Log state changes for debugging
  useEffect(() => {
    console.log('[CoffeeRouletteBoard] Phase changed:', {
      phase,
      pairsCount: pairs.length,
      myPairExists: !!myPair,
      promptsUsed,
      decisionRequired,
    });
  }, [phase, pairs.length, myPair, promptsUsed, decisionRequired]);

  // Update timer
  useEffect(() => {
    if (phase !== 'chatting' || !chatEndsAt) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(chatEndsAt).getTime() - Date.now()) / 1000));
      setChatSecondsRemaining(remaining);

      // Capture elapsed time when timer expires
      if (remaining === 0) {
        capturedElapsedRef.current = 30 * 60; // Chat duration
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, chatEndsAt]);

  // Handle start matching
  const handleStartMatching = useCallback(async () => {
    try {
      setIsLoading(true);
      await onEmitAction('coffee:shuffle');
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to start matching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction]);

  // Handle matching complete → auto-start chat
  const handleMatchingComplete = useCallback(async () => {
    // Single authoritative emitter to prevent duplicate races:
    // only person1 of the first pair starts the shared chat phase.
    const firstPairLeaderId = pairs[0]?.person1?.participantId;
    const iAmAuthoritativeStarter = !!firstPairLeaderId && firstPairLeaderId === currentUserId;
    if (!iAmAuthoritativeStarter) {
      return;
    }

    try {
      setIsLoading(true);
      await onEmitAction('coffee:start_chat');
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to start chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, onEmitAction, pairs]);

  // Matching phase should auto-advance without custom animations.
  // Keep one authoritative starter (pair[0].person1) and fire once per pairing set.
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
      setIsLoading(true);
      await Promise.race([
        onEmitAction('coffee:next_prompt', {
          // Stale-action guard: server ignores next_prompt if promptsUsed changed.
          expectedPromptsUsed: promptsUsed,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        ),
      ]);
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to get next prompt:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction, promptsUsed]);

  // Handle continue chatting
  const handleContinue = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.race([
        onEmitAction('coffee:continue', {
          // Stale-action guard: server ignores continue if promptsUsed changed.
          expectedPromptsUsed: promptsUsed,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        ),
      ]);
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to continue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction, promptsUsed]);

  // Handle end session
  const handleEnd = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.race([
        onEmitAction('coffee:end'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        ),
      ]);
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to end session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction]);

  // Handle reset (go back to waiting)
  const handleReset = useCallback(async () => {
    try {
      setIsLoading(true);
      await onEmitAction('coffee:reset');
      setCurrentPairIndex(0);
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to reset:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction]);

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

    const elapsedSeconds = capturedElapsedRef.current || (30 * 60 - chatSecondsRemaining);
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

  // Fallback - if myPair not found
  return (
    <div className="flex items-center justify-center h-full min-h-0">
      <div className="text-center">
        <p className="text-lg font-semibold mb-4">
          {t('gamePlay.coffeeRoulette.error.notFound', {
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
export type { CoffeeRouletteBoardProps };
