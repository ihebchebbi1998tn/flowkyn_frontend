/**
 * useGameSession — Manages game session resolution, polling, state sync, and game data.
 *
 * Extracted from GamePlay.tsx to keep the orchestrator lean.
 */

import { useState, useEffect, useCallback } from 'react';
import { gamesApi } from '@/features/app/api/games';
import { useGameStateSync } from '@/hooks/useGameStateSync';
import { GAME_CONFIGS, GAME_KEY_TO_CONFIG_ID } from '../gameTypes';
import type { GameDataPayload, EventNotificationPayload } from '@/features/app/types/socket';

interface UseGameSessionOptions {
  eventId: string | undefined;
  hasJoined: boolean;
  participantId: string | null;
  gamesSocket: any; // ReturnType<typeof useGamesSocket>
  eventsSocket: any; // ReturnType<typeof useEventsSocket>
  urlConfig: typeof GAME_CONFIGS[string];
  showError: (err: unknown, label?: string) => void;
  refetchParticipants: () => void;
  refetchPosts: () => void;
}

export function useGameSession({
  eventId,
  hasJoined,
  participantId,
  gamesSocket,
  eventsSocket,
  urlConfig,
  showError,
  refetchParticipants,
  refetchPosts,
}: UseGameSessionOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [isResolvingSession, setIsResolvingSession] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<unknown>(null);
  const [gameData, setGameData] = useState<unknown>(null);
  const [, setIsGameAdmin] = useState<boolean>(false);
  const [activeConfig, setActiveConfig] = useState(urlConfig);

  // Socket error state for games
  const [gamesSocketError, setGamesSocketError] = useState<string | null>(null);
  const [gamesSocketErrorCode, setGamesSocketErrorCode] = useState<string | null>(null);
  const [gamesSocketErrorDetails, setGamesSocketErrorDetails] = useState<unknown>(null);
  const [gameJoinAckReceived, setGameJoinAckReceived] = useState(false);

  // Game state sync (join room, sync snapshots, etc.)
  const { requestStateSync } = useGameStateSync({
    gamesSocket,
    sessionId,
    hasJoined,
    participantId,
    setActiveRoundId,
    setInitialSnapshot,
    setGameData,
    setIsGameAdmin,
    currentPhase: (gameData as Record<string, unknown>)?.phase as string | null ?? null,
    onGameJoinError: (err) => {
      const errObj = err as Record<string, unknown> | null;
      const exact = errObj?.message || errObj?.code || errObj?.error || String(err);
      setGamesSocketError(String(exact));
      setGamesSocketErrorCode(errObj?.code ? String(errObj.code) : null);
      setGamesSocketErrorDetails(errObj?.details ?? null);
      showError(err, String(exact));
    },
    onGameJoinAck: () => {
      setGameJoinAckReceived(true);
    },
  });

  // Resolve active game session on mount
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const resolveSession = async () => {
      try {
        const session = await gamesApi.getActiveSession(eventId);
        if (!cancelled && session) {
          setSessionId(session.id);
          setSessionStartedAt(session.started_at || null);
          if (session.game_type_key) {
            const correctConfigId = GAME_KEY_TO_CONFIG_ID[session.game_type_key as keyof typeof GAME_KEY_TO_CONFIG_ID];
            if (correctConfigId && GAME_CONFIGS[correctConfigId]) {
              setActiveConfig(GAME_CONFIGS[correctConfigId]);
            }
          }
        } else if (!cancelled && !session) {
          setSessionId(null);
          setSessionStartedAt(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.warn('[useGameSession] Failed to resolve active game session:', err instanceof Error ? err.message : err);
        }
      }
    };

    setIsResolvingSession(true);
    resolveSession().finally(() => {
      if (!cancelled) setIsResolvingSession(false);
    });

    return () => { cancelled = true; };
  }, [eventId]);

  // Poll for session when we don't have one (every 3s to reduce network load)
  useEffect(() => {
    if (!eventId || sessionId || !hasJoined) return;
    const pollId = setInterval(() => {
      gamesApi.getActiveSession(eventId).then((s) => {
        if (s?.id) {
          setSessionId(s.id);
          setSessionStartedAt(s.started_at || null);
        }
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(pollId);
  }, [eventId, sessionId, hasJoined]);

  // Listen for event notifications (participant join, game session, posts)
  useEffect(() => {
    if (!eventsSocket.isConnected || !eventId) return;

    const handleEventNotification = (...args: unknown[]) => {
      const data = args[0] as EventNotificationPayload;
      if (data.type === 'participant:joined' || data.type === 'participant:left') {
        refetchParticipants();
      }
      if (data.type === 'post:created' || data.type === 'post:reacted') {
        refetchPosts();
      }
      if (data.type === 'game:session_created') {
        const sessionIdFromPayload = data.payload?.sessionId;
        if (sessionIdFromPayload) {
          setSessionId(sessionIdFromPayload);
          // Fetch full session to get started_at for the timer
          gamesApi.getActiveSession(eventId).then((s) => {
            if (s?.started_at) setSessionStartedAt(s.started_at);
          }).catch(() => {});
          setTimeout(() => {
            requestStateSync?.('session_created_notification');
          }, 800);
        } else {
          gamesApi.getActiveSession(eventId).then((s) => {
            if (s) {
              setSessionId(s.id);
              setSessionStartedAt(s.started_at || null);
            } else {
              setSessionId(null);
            }
          }).catch(() => {});
        }
      }
    };

    const unsub = eventsSocket.on('event:notification', handleEventNotification);
    return unsub;
  }, [eventsSocket.isConnected, eventId, refetchParticipants, refetchPosts, requestStateSync]);

  // Game state sync from WebSocket
  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;

    let mounted = true;

    const handleGameData = (...args: unknown[]) => {
      const data = args[0] as GameDataPayload;
      if (!mounted) return;
      if (data.sessionId !== sessionId) return;
      setGameData(data.gameData);
    };

    const unsub = gamesSocket.on('game:data', handleGameData);

    return () => {
      mounted = false;
      unsub?.();
    };
  }, [gamesSocket.isConnected, sessionId]);

  // Reset gameJoinAck when session changes
  useEffect(() => {
    setGameJoinAckReceived(false);
  }, [sessionId]);

  // Clear errors on reconnect
  useEffect(() => {
    if (gamesSocket.status === 'connected') {
      setGamesSocketError(null);
      setGamesSocketErrorCode(null);
      setGamesSocketErrorDetails(null);
    }
  }, [gamesSocket.status]);

  const gamesReady = gamesSocket.status === 'connected' && !!sessionId && gameJoinAckReceived;

  useEffect(() => {
    if (gamesReady) setGamesSocketError(null);
  }, [gamesReady]);

  return {
    sessionId,
    setSessionId,
    sessionStartedAt,
    isResolvingSession,
    activeRoundId,
    setActiveRoundId,
    initialSnapshot,
    setInitialSnapshot,
    gameData,
    setGameData,
    activeConfig,
    gamesSocketError,
    gamesSocketErrorCode,
    gamesSocketErrorDetails,
    gamesReady,
    requestStateSync,
  };
}
