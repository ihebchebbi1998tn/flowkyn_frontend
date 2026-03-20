import { useCallback, useEffect, useRef } from 'react';

type GamesSocketLike = {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | string;
  socket?: { on: (event: string, handler: (...args: any[]) => void) => void; off: (event: string, handler: (...args: any[]) => void) => void } | null;
  emit: <T = any>(event: string, data?: any) => Promise<T>;
  on: (event: string, handler: (...args: any[]) => void) => (() => void) | void;
};

function parseRevisionTime(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : 0;
}

interface UseGameStateSyncOptions {
  gamesSocket: GamesSocketLike;
  sessionId: string | null;
  hasJoined: boolean;
  participantId: string | null;
  setActiveRoundId: (v: string | null) => void;
  setInitialSnapshot: (v: unknown) => void;
  setGameData: (v: unknown) => void;
  setIsGameAdmin: (v: boolean) => void;
  onGameJoinError?: (err: unknown) => void;
}

/**
 * Centralized game room join + authoritative state sync logic.
 * Keeps snapshots fresh with revision guards, reconnect sync, and stale watchdog.
 */
export function useGameStateSync({
  gamesSocket,
  sessionId,
  hasJoined,
  participantId,
  setActiveRoundId,
  setInitialSnapshot,
  setGameData,
  setIsGameAdmin,
  onGameJoinError,
}: UseGameStateSyncOptions) {
  const lastServerGameUpdateAtRef = useRef<number>(Date.now());
  const lastSnapshotRevisionIdRef = useRef<string | null>(null);
  const lastSnapshotRevisionTimeRef = useRef<number>(0);
  const stateSyncInFlightRef = useRef(false);
  const lastStateSyncStartedAtRef = useRef(0);

  const applyJoinSnapshotIfNewer = useCallback(
    (data: any) => {
      if (!data?.snapshot) return;
      const incomingRevisionTime = parseRevisionTime(data?.snapshotCreatedAt);
      const currentRevisionTime = lastSnapshotRevisionTimeRef.current;

      // If we already have a known revision time, but the join response lacks a usable timestamp,
      // avoid regressing to an older snapshot.
      if (incomingRevisionTime <= 0 && currentRevisionTime > 0) return;

      const isNewer =
        incomingRevisionTime > 0 ? incomingRevisionTime >= currentRevisionTime : true;

      if (!isNewer) {
        // Prevent a late/queued join ACK from regressing newer game:data state.
        if (import.meta.env.DEV) {
          console.log('[GamePlay][TEMP] join ACK rejected as older snapshot', {
            incomingRevisionTime,
            currentRevisionTime,
            incomingRevisionId: typeof data?.snapshotRevisionId === 'string' ? data.snapshotRevisionId : null,
          });
        }
        return;
      }

      if (incomingRevisionTime > 0) {
        lastSnapshotRevisionTimeRef.current = incomingRevisionTime;
      }
      lastSnapshotRevisionIdRef.current =
        typeof data?.snapshotRevisionId === 'string' ? data.snapshotRevisionId : lastSnapshotRevisionIdRef.current;
      lastServerGameUpdateAtRef.current = Date.now();

      setInitialSnapshot(data.snapshot);
      setGameData(data.snapshot);
      if (import.meta.env.DEV) {
        console.log('[GamePlay][TEMP] join ACK applied snapshot', {
          incomingRevisionTime,
          snapshotKind: (data.snapshot as any)?.kind,
          snapshotPhase: (data.snapshot as any)?.phase,
          incomingRevisionId: typeof data?.snapshotRevisionId === 'string' ? data.snapshotRevisionId : null,
        });
      }
    },
    [setGameData, setInitialSnapshot]
  );

  const joinGameRoom = useCallback(() => {
    if (!participantId && !hasJoined) return;
    if (gamesSocket.isConnected && sessionId) {
      console.log('[GamePlay] Emitting game:join for', sessionId);
      gamesSocket
        .emit<any>('game:join', { sessionId })
        .then((resp: any) => {
          const data = resp?.data || resp;
          console.log('[GamePlay] game:join resp:', data);
          if (data?.activeRoundId) setActiveRoundId(data.activeRoundId);
          setIsGameAdmin(!!data?.isAdmin);
          applyJoinSnapshotIfNewer(data);
        })
        .catch((err: any) => {
          console.warn('[GamePlay] Failed to join game room (transient):', err?.message || err);
          onGameJoinError?.(err);
        });
    }
  }, [
    gamesSocket,
    gamesSocket.isConnected,
    hasJoined,
    participantId,
    sessionId,
    setActiveRoundId,
    setGameData,
    setInitialSnapshot,
    setIsGameAdmin,
    applyJoinSnapshotIfNewer,
    onGameJoinError,
  ]);

  const requestStateSync = useCallback(
    async (reason: string) => {
      if (!gamesSocket.isConnected || !sessionId) return;
      const now = Date.now();
      if (stateSyncInFlightRef.current) return;
      if (now - lastStateSyncStartedAtRef.current < 600) return;

      stateSyncInFlightRef.current = true;
      lastStateSyncStartedAtRef.current = now;
      try {
        console.log('[GamePlay][sync] requesting game:state_sync', { sessionId, reason });
        await gamesSocket.emit('game:state_sync', { sessionId });
      } catch (err: any) {
        console.warn('[GamePlay][sync] game:state_sync failed', {
          sessionId,
          reason,
          error: err?.message || err,
        });
      } finally {
        stateSyncInFlightRef.current = false;
      }
    },
    [gamesSocket, gamesSocket.isConnected, sessionId]
  );

  useEffect(() => {
    if (gamesSocket.isConnected && sessionId) joinGameRoom();
  }, [gamesSocket.isConnected, joinGameRoom, sessionId]);

  useEffect(() => {
    if (!gamesSocket.socket) return;
    const onConnect = () => {
      console.log('[GamePlay] Games socket reconnected, re-joining room...');
      joinGameRoom();
      if (sessionId) void requestStateSync('socket_connect_listener');
    };
    gamesSocket.socket.on('connect', onConnect);
    return () => {
      gamesSocket.socket?.off('connect', onConnect);
    };
  }, [gamesSocket.socket, joinGameRoom, requestStateSync, sessionId]);

  useEffect(() => {
    if (!gamesSocket.isConnected) return;
    const unsubState = gamesSocket.on('game:state', (payload: any) => {
      const snap = payload?.state?.snapshot;
      const ar = payload?.state?.activeRoundId;
      const incomingRevisionId =
        typeof payload?.state?.snapshotRevisionId === 'string' ? payload.state.snapshotRevisionId : null;
      const incomingRevisionTime = parseRevisionTime(payload?.state?.snapshotCreatedAt);
      console.log('[GamePlay] Received game:state event:', { hasSnapshot: !!snap, hasActiveRound: !!ar });
      if (ar) setActiveRoundId(ar);
      if (snap) {
        const currentRevisionTime = lastSnapshotRevisionTimeRef.current;
        const isNewer = incomingRevisionTime > 0 ? incomingRevisionTime >= currentRevisionTime : true;
        if (!isNewer) {
          console.log('[GamePlay][sync] Ignoring stale game:state snapshot', {
            incomingRevisionId,
            incomingRevisionTime,
            currentRevisionTime,
          });
          return;
        }
        lastSnapshotRevisionTimeRef.current = incomingRevisionTime || currentRevisionTime;
        lastSnapshotRevisionIdRef.current = incomingRevisionId;
        lastServerGameUpdateAtRef.current = Date.now();
        console.log('[GamePlay] Updating game state from game:state event:', snap.kind, {
          incomingRevisionId,
          incomingRevisionTime,
        });
        setInitialSnapshot(snap);
        setGameData(snap);
      }
    });

    const unsubData = gamesSocket.on('game:data', (payload: any) => {
      if (payload?.gameData) {
        const incomingRevisionId = typeof payload?.snapshotRevisionId === 'string' ? payload.snapshotRevisionId : null;
        const incomingRevisionTime = parseRevisionTime(payload?.snapshotCreatedAt);
        const currentRevisionTime = lastSnapshotRevisionTimeRef.current;
        const isNewer = incomingRevisionTime > 0 ? incomingRevisionTime >= currentRevisionTime : true;
        if (!isNewer) {
          console.log('[GamePlay][sync] Ignoring stale game:data snapshot', {
            incomingRevisionId,
            incomingRevisionTime,
            currentRevisionTime,
          });
          if (import.meta.env.DEV) {
            console.log('[GamePlay][TEMP] game:data ignored as older snapshot', {
              incomingRevisionId,
              incomingRevisionTime,
              currentRevisionTime,
              gameKind: payload?.gameData?.kind,
              gamePhase: payload?.gameData?.phase,
            });
          }
          return;
        }
        lastSnapshotRevisionTimeRef.current = incomingRevisionTime || currentRevisionTime;
        lastSnapshotRevisionIdRef.current = incomingRevisionId;
        lastServerGameUpdateAtRef.current = Date.now();
        console.log('[GamePlay] Received game:data event:', payload.gameData.kind, {
          incomingRevisionId,
          incomingRevisionTime,
        });
        if (import.meta.env.DEV) {
          console.log('[GamePlay][TEMP] game:data applied snapshot', {
            incomingRevisionId,
            incomingRevisionTime,
            gameKind: payload?.gameData?.kind,
            gamePhase: payload?.gameData?.phase,
          });
        }
        setGameData(payload.gameData);
      }
    });

    const unsubStarted = gamesSocket.on('game:started', () => {
      if (sessionId) void requestStateSync('event:game_started');
    });
    const unsubRoundStarted = gamesSocket.on('game:round_started', (payload: any) => {
      if (payload?.roundId) setActiveRoundId(payload.roundId);
      if (sessionId) void requestStateSync('event:round_started');
    });
    const unsubRoundEnded = gamesSocket.on('game:round_ended', () => {
      if (sessionId) void requestStateSync('event:round_ended');
    });
    const unsubEnded = gamesSocket.on('game:ended', () => {
      if (sessionId) void requestStateSync('event:game_ended');
    });

    return () => {
      unsubState?.();
      unsubData?.();
      unsubStarted?.();
      unsubRoundStarted?.();
      unsubRoundEnded?.();
      unsubEnded?.();
    };
  }, [
    gamesSocket,
    gamesSocket.isConnected,
    requestStateSync,
    sessionId,
    setActiveRoundId,
    setGameData,
    setInitialSnapshot,
  ]);

  // Extra periodic safety refresh:
  // If a client briefly missed a state update during join/room reconnect,
  // periodic state_sync helps keep phase timers stable (no "reset on reload")
  // and ensures all clients converge without requiring a manual reload.
  useEffect(() => {
    if (!gamesSocket.isConnected) return;
    if (!sessionId) return;
    if (!participantId && !hasJoined) return;

    const interval = window.setInterval(() => {
      void requestStateSync('periodic_refresh');
    }, 8000);

    return () => clearInterval(interval);
  }, [gamesSocket.isConnected, sessionId, participantId, hasJoined, requestStateSync]);

  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;
    if (!participantId && !hasJoined) return;

    let cancelled = false;
    const retryDelaysMs = [0, 700, 1600, 3000];
    const timers: number[] = [];

    const attemptJoin = async (attempt: number) => {
      if (cancelled) return;
      try {
        const ack = await gamesSocket.emit<any>('game:join', { sessionId });
        const ok = (ack as any)?.ok;
        const data = (ack as any)?.data;
        if (ok === false) {
          throw new Error((ack as any)?.error || 'JOIN_FAILED');
        }
        // Apply snapshot only if it is not older than what we already have.
        applyJoinSnapshotIfNewer(data);
        if (data?.activeRoundId) {
          setActiveRoundId(data.activeRoundId);
        }
        await requestStateSync(`join_attempt_${attempt}`);
        console.log('[GamePlay] game:join succeeded', { sessionId, attempt });
      } catch (err: any) {
        console.warn('[GamePlay] game:join failed, will retry if attempts remain', {
          sessionId,
          attempt,
          error: err?.message || err,
        });
        onGameJoinError?.(err);
      }
    };

    retryDelaysMs.forEach((delay, idx) => {
      const id = window.setTimeout(() => {
        void attemptJoin(idx + 1);
      }, delay);
      timers.push(id);
    });

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [
    gamesSocket,
    gamesSocket.isConnected,
    hasJoined,
    participantId,
    requestStateSync,
    sessionId,
    setActiveRoundId,
    setGameData,
    setInitialSnapshot,
  ]);

  const wasGamesConnectedRef = useRef(false);
  useEffect(() => {
    if (gamesSocket.status === 'connected') {
      if (!wasGamesConnectedRef.current) {
        wasGamesConnectedRef.current = true;
        if (sessionId) void requestStateSync('socket_reconnected');
      }
    } else {
      wasGamesConnectedRef.current = false;
    }
  }, [gamesSocket.status, requestStateSync, sessionId]);

  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;
    const id = window.setInterval(() => {
      const staleForMs = Date.now() - lastServerGameUpdateAtRef.current;
      if (staleForMs > 9000) {
        void requestStateSync('watchdog_stale_state');
      }
    }, 2500);
    return () => window.clearInterval(id);
  }, [gamesSocket.isConnected, requestStateSync, sessionId]);
}

