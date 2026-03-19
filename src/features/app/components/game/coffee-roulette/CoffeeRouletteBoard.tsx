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
import { GAME_TYPES } from '@/features/app/pages/play/gameTypes';
import { RoomThemeProvider } from './theme/RoomThemeContext';
import { OfficeLobby } from './phases/OfficeLobby';
import { ElevatorSequence } from './phases/ElevatorSequence';
import { MeetingRoom } from './phases/MeetingRoom';
import { OfficeExitAnimation } from './phases/OfficeExitAnimation';
import { getThemeForPair } from './theme/roomThemes';

type GamePhase = 'waiting' | 'matching' | 'chatting' | 'complete';

interface CoffeeSnapshot {
  kind: typeof GAME_TYPES.COFFEE_ROULETTE;
  phase: GamePhase;
  pairs: Array<{
    id: string;
    person1: { participantId: string; name: string; avatar: string; avatarUrl?: string | null };
    person2: { participantId: string; name: string; avatar: string; avatarUrl?: string | null };
    topic: string;
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
    try {
      setIsLoading(true);
      await onEmitAction('coffee:start_chat');
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to start chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction]);

  // Handle next prompt
  const handleNextPrompt = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.race([
        onEmitAction('coffee:next_prompt'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        ),
      ]);
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to get next prompt:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction]);

  // Handle continue chatting
  const handleContinue = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.race([
        onEmitAction('coffee:continue'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        ),
      ]);
    } catch (error) {
      console.error('[CoffeeRouletteBoard] Failed to continue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onEmitAction]);

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
      <RoomThemeProvider themeName={themeName}>
        <OfficeLobby
          participants={formattedParticipants}
          onStartMatching={handleStartMatching}
          isLoading={isLoading}
        />
      </RoomThemeProvider>
    );
  }

  // PHASE: Matching - Elevator Animation
  if (phase === 'matching') {
    return (
      <RoomThemeProvider themeName={themeName}>
        <ElevatorSequence
          pairNumber={currentPairIndex}
          totalPairs={Math.ceil(participants.length / 2)}
          onSequenceComplete={handleMatchingComplete}
        />
      </RoomThemeProvider>
    );
  }

  // PHASE: Chatting - Meeting Room
  if (phase === 'chatting' && myPair) {
    const isMyPerson1 = myPair.person1.participantId === currentUserId;
    const person1 = isMyPerson1 ? myPair.person1 : myPair.person2;
    const person2 = isMyPerson1 ? myPair.person2 : myPair.person1;

    const pairId = myPair.id;
    const isOfferer = isMyPerson1; // person1 in snapshot creates the offer
    const partnerParticipantId = isOfferer ? myPair.person2.participantId : myPair.person1.participantId;

    return (
      <RoomThemeProvider themeName={themeName}>
        <MeetingRoom
          person1={person1}
          person2={person2}
          topic={myPair.topic}
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
          onNextPrompt={handleNextPrompt}
          onContinue={handleContinue}
          onEnd={handleEnd}
          isLoading={isLoading}
        />
      </RoomThemeProvider>
    );
  }

  // PHASE: Complete - Exit Animation
  if (phase === 'complete' && myPair) {
    const isMyPerson1 = myPair.person1.participantId === currentUserId;
    const person1 = isMyPerson1 ? myPair.person1 : myPair.person2;
    const person2 = isMyPerson1 ? myPair.person2 : myPair.person1;

    const elapsedSeconds = capturedElapsedRef.current || (30 * 60 - chatSecondsRemaining);

    return (
      <RoomThemeProvider themeName={themeName}>
        <OfficeExitAnimation
          person1={person1}
          person2={person2}
          topic={myPair.topic}
          duration={elapsedSeconds}
          promptsUsed={promptsUsed}
          onReset={handleReset}
          onExit={handleEnd}
          isLoading={isLoading}
        />
      </RoomThemeProvider>
    );
  }

  // Fallback - if myPair not found
  return (
    <div className="flex items-center justify-center min-h-screen">
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
