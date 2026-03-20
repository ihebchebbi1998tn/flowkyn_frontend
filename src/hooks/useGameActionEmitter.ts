/**
 * Encapsulates game action emission logic: auto-create session, socket join, action emit,
 * and backend error handling. Used by GameBoardRouter.
 */
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { gamesApi } from '@/features/app/api/games';
import type { GameTypeKey } from '@/features/app/pages/play/gameTypes';

type GameTypeRow = { id: string; key: GameTypeKey; name?: string };
type GameSessionRow = { id: string; active_round_id?: string | null };

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function isGameTypeRow(v: unknown): v is GameTypeRow {
  return isRecord(v) && typeof v.id === 'string' && typeof v.key === 'string';
}

function isGameSessionRow(v: unknown): v is GameSessionRow {
  return isRecord(v) && typeof v.id === 'string';
}

type GamesSocket = ReturnType<typeof import('@/hooks/useSocket')['useGamesSocket']>;

export type EmitActionOpts = { sessionIdOverride?: string };

export type UseGameActionEmitterParams = {
  gameTypeKey: GameTypeKey;
  eventId?: string;
  sessionId: string | null;
  activeRoundId: string | null;
  setSessionId: (id: string | null) => void;
  setActiveRoundId: (id: string | null) => void;
  setInitialSnapshot: (snap: unknown) => void;
  setGameData: (data: unknown) => void;
  gamesSocket: GamesSocket;
  showError: (err: unknown, label?: string) => void;
};

export function useGameActionEmitter({
  gameTypeKey,
  eventId,
  sessionId,
  activeRoundId,
  setSessionId,
  setActiveRoundId,
  setInitialSnapshot,
  setGameData,
  gamesSocket,
  showError,
}: UseGameActionEmitterParams) {
  const { t } = useTranslation();
  const ensuredJoinForSessionRef = useRef<string | null>(null);

  const onEmitAction = useCallback(
    async (actionType: string, payload?: unknown, opts?: EmitActionOpts) => {
      const forcedSid = opts?.sessionIdOverride;
      let sid = forcedSid ?? sessionId;

      // Auto-create session if none exists
      if (!sid && eventId) {
        try {
          const typesUnknown = await gamesApi.listTypes();
          const types = Array.isArray(typesUnknown) ? typesUnknown : [];
          const typeRow = types.find((gt) => isGameTypeRow(gt) && gt.key === gameTypeKey) as GameTypeRow | undefined;
          if (!typeRow) {
            console.error('[GameBoardRouter] Unknown game type key:', gameTypeKey);
            return;
          }
          const desiredRounds =
            actionType === 'two_truths:start'
              ? Number(isRecord(payload) ? payload.totalRounds : undefined)
              : undefined;
          const totalRoundsToSend =
            Number.isFinite(desiredRounds) && Number.isInteger(desiredRounds) && desiredRounds >= 1
              ? desiredRounds
              : undefined;

          const newSessionUnknown = await gamesApi.startSession(eventId, typeRow.id, totalRoundsToSend);
          if (!isGameSessionRow(newSessionUnknown)) throw new Error('Invalid game session response');
          const newSession = newSessionUnknown;
          sid = newSession.id;
          setSessionId(sid);
          if (newSession.active_round_id) setActiveRoundId(newSession.active_round_id);

          if (gamesSocket.isConnected) {
            const respUnknown = await gamesSocket.emit('game:join', { sessionId: sid });
            const respRecord = isRecord(respUnknown) ? (respUnknown as Record<string, unknown>) : null;
            const respData = respRecord && isRecord(respRecord.data) ? respRecord.data : null;
            const data = respData ?? respUnknown;
            if (isRecord(data) && typeof data.activeRoundId === 'string') setActiveRoundId(data.activeRoundId);
            if (isRecord(data) && data.snapshot) {
              setInitialSnapshot(data.snapshot);
              setGameData(data.snapshot);
            }

            try {
              await gamesSocket.emit('game:action', {
                sessionId: sid,
                roundId: actionType.startsWith('coffee:') ? undefined : (newSession.active_round_id ?? undefined),
                actionType,
                payload: isRecord(payload) ? payload : {},
              });
            } catch (actionErr) {
              const msg = actionErr instanceof Error ? actionErr.message : String(actionErr);
              console.warn('[GameBoardRouter] Failed to emit action after session create:', msg);
            }
          }

          toast.success(
            t('games.toasts.launching', {
              defaultValue: "We're launching {{gameName}} for this event. Hang tight — your screen will update in a moment.",
              gameName: typeRow.name || gameTypeKey,
            })
          );
        } catch (err: unknown) {
          const errObj = err as { response?: { data?: { code?: unknown } }; code?: unknown };
          const backendCode =
            (typeof errObj?.response?.data?.code === 'string' ? errObj.response.data.code : undefined) ||
            (typeof errObj?.code === 'string' ? errObj.code : undefined);
          if (backendCode === 'SESSION_NOT_ACTIVE') {
            showError(err, t('games.errors.sessionNotActive', 'Cannot start a game because the event is not active yet. Ask your workspace admin or host to start the event first.'));
          } else if (backendCode === 'INSUFFICIENT_PERMISSIONS' || backendCode === 'FORBIDDEN') {
            showError(err, t('games.errors.notAuthorizedToStart', 'Only event admins or moderators can start this game. Ask your facilitator to launch it for the group.'));
          } else if (backendCode === 'NOT_A_MEMBER') {
            showError(err, t('games.errors.notMember', 'You are not a member of this workspace for this event. Please contact your admin if this feels wrong.'));
          } else {
            showError(err, t('games.errors.genericStartFailed', 'Failed to start the game session. Please try again or ask your host to start it for you.'));
          }
          return;
        }
      }

      if (!sid) {
        console.warn('[GameBoardRouter] onEmitAction aborted — no sessionId resolved', { gameKey: gameTypeKey, actionType });
        return;
      }

      if (!gamesSocket.isConnected) {
        showError(new Error('Game socket not connected'), 'Game socket not connected');
        return;
      }

      // Ensure we've joined the game room when using a forced sessionId
      if (forcedSid && ensuredJoinForSessionRef.current !== forcedSid) {
        try {
          const respUnknown = await gamesSocket.emit('game:join', { sessionId: forcedSid });
          const respRecord = isRecord(respUnknown) ? (respUnknown as Record<string, unknown>) : null;
          const respData = respRecord && isRecord(respRecord.data) ? respRecord.data : null;
          const data = respData ?? respUnknown;
          if (isRecord(data) && typeof data.activeRoundId === 'string') setActiveRoundId(data.activeRoundId);
          if (isRecord(data) && data.snapshot) {
            setInitialSnapshot(data.snapshot);
            setGameData(data.snapshot);
          }
          ensuredJoinForSessionRef.current = forcedSid;
        } catch (joinErr) {
          const msg = joinErr instanceof Error ? joinErr.message : String(joinErr);
          console.warn('[GameBoardRouter] forced join failed (best-effort):', msg);
        }
      }

      await gamesSocket.emit('game:action', {
        sessionId: sid,
        roundId: actionType.startsWith('coffee:') ? undefined : (activeRoundId || undefined),
        actionType,
        payload: isRecord(payload) ? payload : {},
      });
    },
    [
      activeRoundId,
      gameTypeKey,
      eventId,
      gamesSocket,
      sessionId,
      setActiveRoundId,
      setGameData,
      setInitialSnapshot,
      setSessionId,
      showError,
      t,
    ]
  );

  return onEmitAction;
}
