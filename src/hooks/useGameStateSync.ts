import { useCallback, useEffect, useRef } from 'react';

type GamesSocketLike = {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | string;
  socket?: { on: (event: string, handler: (...args: any[]) => void) => void; off: (event: string, handler: (...args: any[]) => void) => void } | null;
  emit: <T = any>(event: string, data?: any) => Promise<T>;
  on: (event: string, handler: (...args: any[]) => void) => (() => void) | void;
};

function parseRevisionTime(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const ts = Date.parse(value);
    return Number.isFinite(ts) ? ts : 0;
  }
  return 0;
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
  onGameDebug?: (evt: { type: string; detail?: string; data?: unknown }) => void;
  onGameJoinAck?: (payload: any) => void;
  currentPhase?: string | null;
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
  onGameDebug,
  onGameJoinAck,
  currentPhase,
}: UseGameStateSyncOptions): { requestStateSync: (reason: string) => Promise<void> } {
  const lastServerGameUpdateAtRef = useRef<number>(Date.now());
  const lastSnapshotRevisionIdRef = useRef<string | null>(null);
  const lastSnapshotRevisionTimeRef = useRef<number>(0);
  const stateSyncInFlightRef = useRef(false);
  const lastStateSyncStartedAtRef = useRef(0);
  const joinedGameAckRef = useRef<{ sessionId: string; at: number } | null>(null);
  const joinInFlightRef = useRef<string | null>(null);
  const coffeeFollowupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPhaseRef = useRef<string | null>(null);

  // Reset join-ack guard when switching sessions or losing connection.
  useEffect(() => {
    if (!sessionId) {
      joinedGameAckRef.current = null;
      joinInFlightRef.current = null;
      return;
    }
    if (gamesSocket.status !== 'connected') {
      joinedGameAckRef.current = null;
      joinInFlightRef.current = null;
    }
  }, [sessionId, gamesSocket.status]);

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
      lastPhaseRef.current = (data.snapshot as any)?.phase || null;

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
    // Don't join until identity/join lifecycle is complete; otherwise backend rejects with FORBIDDEN.
    if (!hasJoined && !participantId) return;
    if (gamesSocket.isConnected && sessionId) {
      // Avoid repeated game:join emissions once we already got an ACK for this session.
      if (joinedGameAckRef.current?.sessionId === sessionId) return;
      // Prevent overlapping emits for the same session during reconnect/jitter.
      if (joinInFlightRef.current === sessionId) return;
      joinInFlightRef.current = sessionId;
      console.log('[GamePlay] Emitting game:join for', sessionId);
      onGameDebug?.({
        type: 'game:join_emit',
        detail: `emit game:join sessionId=${sessionId}`,
        data: { socketStatus: gamesSocket.status, hasJoined, participantId: participantId || null },
      });
      gamesSocket
        .emit<any>('game:join', { sessionId })
        .then((data: any) => {
          console.log('[GamePlay] game:join resp:', data);
          // If the ACK resolved, the server accepted the join even if snapshot is null.
          if (!joinedGameAckRef.current || joinedGameAckRef.current.sessionId !== sessionId) {
            joinedGameAckRef.current = { sessionId, at: Date.now() };
          }
          // Always notify UI that we got a successful game:join ACK.
          onGameJoinAck?.(data);
          onGameDebug?.({
            type: 'game:join_ack',
            detail: 'game:join ack received',
            data: {
              hasSnapshot: !!data?.snapshot,
              snapshotKind: data?.snapshot?.kind || null,
              snapshotPhase: data?.snapshot?.phase || null,
              snapshotCreatedAt: data?.snapshotCreatedAt || null,
              activeRoundId: data?.activeRoundId || null,
              isAdmin: data?.isAdmin ?? null,
              snapshotRevisionTime: data?.snapshotCreatedAt || null,
            },
          });
          if (data?.activeRoundId) setActiveRoundId(data.activeRoundId);
          setIsGameAdmin(!!data?.isAdmin);
          applyJoinSnapshotIfNewer(data);
        })
        .catch((err: any) => {
          console.warn('[GamePlay] Failed to join game room (transient):', err?.message || err);
          onGameJoinError?.(err);
          onGameDebug?.({
            type: 'game:join_emit_failed',
            detail: err?.message || String(err),
            data: err,
          });
        })
        .finally(() => {
          if (joinInFlightRef.current === sessionId) {
            joinInFlightRef.current = null;
          }
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
    onGameDebug,
    onGameJoinAck,
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
        onGameDebug?.({
          type: 'game:state_event',
          detail: `game:state snapshot incomingRevisionTime=${incomingRevisionTime} currentRevisionTime=${currentRevisionTime} accepted=${String(
            isNewer,
          )}`,
          data: {
            incomingRevisionId,
            incomingRevisionTime,
            snapshotKind: snap?.kind || null,
            snapshotPhase: snap?.phase || null,
          },
        });
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
        lastPhaseRef.current = snap.phase || null;
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
        onGameDebug?.({
          type: 'game:data_event',
          detail: `game:data incomingRevisionTime=${incomingRevisionTime} currentRevisionTime=${currentRevisionTime} accepted=${String(isNewer)}`,
          data: {
            incomingRevisionId,
            incomingRevisionTime,
            gameKind: payload?.gameData?.kind || null,
            gamePhase: payload?.gameData?.phase || null,
          },
        });
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
        lastPhaseRef.current = (payload.gameData as any)?.phase || null;
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
        setInitialSnapshot(payload.gameData);
        setGameData(payload.gameData);

        // Coffee Roulette: schedule a debounced follow-up sync when in chatting phase
        // to catch any topic/state updates that may have been missed.
        const gd = payload.gameData as { kind?: string; phase?: string };
        if (gd?.kind === 'coffee-roulette' && gd?.phase === 'chatting' && sessionId) {
          if (coffeeFollowupTimerRef.current) clearTimeout(coffeeFollowupTimerRef.current);
          coffeeFollowupTimerRef.current = setTimeout(() => {
            coffeeFollowupTimerRef.current = null;
            void requestStateSync('coffee_chatting_followup');
          }, 2000);
        }
      }
    });

    const unsubStarted = gamesSocket.on('game:started', () => {
      onGameDebug?.({ type: 'game:started', detail: 'received game:started' });
      if (sessionId) void requestStateSync('event:game_started');
    });
    const unsubRoundStarted = gamesSocket.on('game:round_started', (payload: any) => {
      onGameDebug?.({
        type: 'game:round_started',
        detail: `received game:round_started roundId=${payload?.roundId || 'null'}`,
        data: payload,
      });
      if (payload?.roundId) setActiveRoundId(payload.roundId);
      if (sessionId) void requestStateSync('event:round_started');
    });
    const unsubRoundEnded = gamesSocket.on('game:round_ended', () => {
      onGameDebug?.({ type: 'game:round_ended', detail: 'received game:round_ended' });
      if (sessionId) void requestStateSync('event:round_ended');
    });
    const unsubEnded = gamesSocket.on('game:ended', () => {
      onGameDebug?.({ type: 'game:ended', detail: 'received game:ended' });
      if (sessionId) void requestStateSync('event:game_ended');
    });

    return () => {
      if (typeof unsubState === 'function') unsubState();
      if (typeof unsubData === 'function') unsubData();
      if (typeof unsubStarted === 'function') unsubStarted();
      if (typeof unsubRoundStarted === 'function') unsubRoundStarted();
      if (typeof unsubRoundEnded === 'function') unsubRoundEnded();
      if (typeof unsubEnded === 'function') unsubEnded();
    };
  }, [
    gamesSocket,
    gamesSocket.isConnected,
    requestStateSync,
    sessionId,
    setActiveRoundId,
    setGameData,
    setInitialSnapshot,
    onGameDebug,
  ]);

  // Immediate state sync when a new session is discovered.
  // When sessionId transitions from null to a value, the player may have missed
  // the initial game:data broadcast. This triggers a fast catch-up sync.
  const prevSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!sessionId || !gamesSocket.isConnected) {
      prevSessionIdRef.current = sessionId;
      return;
    }
    // Only fire when sessionId transitions from null/different to a new value
    if (prevSessionIdRef.current !== sessionId) {
      prevSessionIdRef.current = sessionId;
      const timer = window.setTimeout(() => {
        void requestStateSync('session_discovered');
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [sessionId, gamesSocket.isConnected, requestStateSync]);

  // Extra periodic safety refresh:
  // If a client briefly missed a state update during join/room reconnect,
  // periodic state_sync helps keep phase timers stable (no "reset on reload")
  // and ensures all clients converge without requiring a manual reload.
  useEffect(() => {
    if (!gamesSocket.isConnected) return;
    if (!sessionId) return;

    // 30s standard fallback, but 5s if we are in 'waiting' phase to catch game start quickly.
    const intervalMs = currentPhase === 'waiting' ? 5000 : 30000;
    
    const id = window.setInterval(() => {
      void requestStateSync('periodic_refresh');
    }, intervalMs);

    return () => clearInterval(id);
  }, [gamesSocket.isConnected, sessionId, participantId, hasJoined, requestStateSync, currentPhase]);

  // Tab Visibility Sync Trigger
  useEffect(() => {
    if (!sessionId) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gamesSocket.isConnected) {
        void requestStateSync('tab_visibility_visible');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId, gamesSocket.isConnected, requestStateSync]);

  // When another player joins the game room, sync immediately (shuffle may have just happened)
  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;
    const unsub = gamesSocket.on('game:player_joined', () => {
      void requestStateSync('game:player_joined');
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [gamesSocket, gamesSocket.isConnected, sessionId, requestStateSync]);

  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;
    if (!hasJoined && !participantId) return;
    // Stop retry spam once we already got an ACK for this session.
    if (joinedGameAckRef.current?.sessionId === sessionId) return;

    let cancelled = false;
    // Start at 300ms so the synchronous joinGameRoom() effect can win first.
    const retryDelaysMs = [300, 1000, 2000, 3500];
    const timers: number[] = [];

    const attemptJoin = async (attempt: number) => {
      if (cancelled) return;
      // Re-check inside the async callback — joinGameRoom may have acked by now.
      if (joinedGameAckRef.current?.sessionId === sessionId) return;
      try {
        onGameDebug?.({
          type: 'game:join_retry_emit',
          detail: `retry game:join attempt=${attempt} sessionId=${sessionId}`,
          data: { socketStatus: gamesSocket.status },
        });
        // Our `useSocket.emit()` resolves with `response.data` for ok acks.
        const data = await gamesSocket.emit<any>('game:join', { sessionId });
        onGameDebug?.({
          type: 'game:join_retry_ack',
          detail: `retry ack attempt=${attempt} receivedData`,
          data: {
            hasSnapshot: !!data?.snapshot,
            activeRoundId: data?.activeRoundId || null,
            snapshotKind: data?.snapshot?.kind || null,
            snapshotPhase: data?.snapshot?.phase || null,
          },
        });
        // Apply snapshot only if it is not older than what we already have.
        if (!joinedGameAckRef.current || joinedGameAckRef.current.sessionId !== sessionId) {
          joinedGameAckRef.current = { sessionId, at: Date.now() };
        }
        onGameJoinAck?.(data);
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
        onGameDebug?.({
          type: 'game:join_retry_failed',
          detail: `retry failed attempt=${attempt} error=${err?.message || String(err)}`,
          data: err,
        });
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
    applyJoinSnapshotIfNewer,
    onGameJoinAck,
    onGameJoinError,
    onGameDebug,
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
      if (staleForMs > 6000) {
        void requestStateSync('watchdog_stale_state');
      }
    }, 2500);
    return () => window.clearInterval(id);
  }, [gamesSocket.isConnected, requestStateSync, sessionId]);

  return { requestStateSync };
}

