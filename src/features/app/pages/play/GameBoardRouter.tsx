import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TwoTruthsBoard, WinsOfTheWeekBoard, StrategicEscapeBoard, ComingSoonBoard } from '@/features/app/components/game/boards';
import { CoffeeRouletteBoard } from '@/features/app/components/game/coffee-roulette';
import type { GameParticipant } from '@/features/app/components/game/shell';
import { eventsApi } from '@/features/app/api/events';
import { postsApi } from '@/features/app/api/posts';
import { gamesApi } from '@/features/app/api/games';
import type { GameTypeKey } from './gameTypes';
import { GAME_TYPES, GAME_CONFIGS, GAME_KEY_TO_CONFIG_ID } from './gameTypes';
import { toast } from 'sonner';

interface GameBoardRouterProps {
  config: {
    gameTypeKey: GameTypeKey;
    promptKey?: string;
  };
  eventId?: string;
  participants: GameParticipant[];
  participantId: string | null;
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  activeRoundId: string | null;
  setActiveRoundId: (id: string | null) => void;
  initialSnapshot: any;
  setInitialSnapshot: (snap: any) => void;
  gameData: any;
  setGameData: (data: any) => void;
  isGameAdmin: boolean;
  winsPosts: Array<{
    id: string;
    authorName: string;
    authorAvatar: string;
    authorAvatarUrl?: string | null;
    content: string;
    timestamp: string;
    reactions: { type: string; count: number; reacted: boolean }[];
  }>;
  canPostWins: boolean;
  winsEndTimeIso?: string | null;
  winsPostingClosed?: boolean;
  postParticipantId: string | null;
  refetchPosts: () => Promise<any>;
  gamesSocket: ReturnType<typeof import('@/hooks/useSocket')['useGamesSocket']>;
  showError: (err: any, label?: string) => void;
}

export function GameBoardRouter({
  config,
  eventId,
  participants,
  participantId,
  currentUserName,
  currentUserAvatarUrl,
  sessionId,
  setSessionId,
  activeRoundId,
  setActiveRoundId,
  initialSnapshot,
  setInitialSnapshot,
  gameData,
  setGameData,
  isGameAdmin,
  winsPosts,
  canPostWins,
  winsEndTimeIso,
  winsPostingClosed,
  postParticipantId,
  refetchPosts,
  gamesSocket,
  showError,
}: GameBoardRouterProps) {
  const { t } = useTranslation();

  const boardProps = {
    participants,
    currentUserId: participantId || '',
    currentUserName: currentUserName || undefined,
    currentUserAvatar: (currentUserName || '??').slice(0, 2).toUpperCase(),
    currentUserAvatarUrl,
    // Some boards may display a round number; do not pass roundId UUIDs here.
    round: typeof gameData?.round === 'number'
      ? gameData.round
      : (typeof initialSnapshot?.round === 'number' ? initialSnapshot.round : 1),
    onRoundComplete: (r: number) => console.log('[GamePlay] Round complete:', r),
  };

  const onEmitAction = useCallback(
    async (actionType: string, payload?: any) => {
      console.log('[GamePlay] onEmitAction', {
        gameKey: config.gameTypeKey,
        actionType,
        hasSession: !!sessionId,
        activeRoundId,
      });

      let sid = sessionId;

      // Auto-create a game session if one doesn't exist yet (e.g. first "Start Round")
      if (!sid && eventId) {
        try {
          const types = await gamesApi.listTypes();
          const typeRow = (types as any[]).find((gt: any) => gt.key === config.gameTypeKey);
          if (!typeRow) {
            console.error('[GamePlay] Unknown game type key:', config.gameTypeKey);
            return;
          }
          const desiredRounds =
            actionType === 'two_truths:start'
              ? Number(payload?.totalRounds)
              : undefined;
          const totalRoundsToSend =
            Number.isFinite(desiredRounds) && Number.isInteger(desiredRounds) && desiredRounds >= 1
              ? desiredRounds
              : undefined;

          const newSession = (await gamesApi.startSession(eventId, typeRow.id, totalRoundsToSend)) as any;
          console.log('[GamePlay] Auto-created game session', {
            eventId,
            gameKey: config.gameTypeKey,
            sessionId: newSession.id,
            active_round_id: newSession.active_round_id,
          });
          sid = newSession.id;
          setSessionId(sid);
          if (newSession.active_round_id) setActiveRoundId(newSession.active_round_id);

          if (gamesSocket.isConnected) {
            const resp: any = await gamesSocket.emit<any>('game:join', { sessionId: sid });
            const data = resp?.data || resp;
            if (data?.activeRoundId) setActiveRoundId(data.activeRoundId);
            if (data?.snapshot) {
              setInitialSnapshot(data.snapshot);
              setGameData(data.snapshot);
            }
          }

          toast.success(
            t('games.toasts.launching', {
              defaultValue: 'We’re launching {{gameName}} for this event. Hang tight — your screen will update in a moment.',
              gameName: typeRow.name || config.gameTypeKey,
            })
          );
        } catch (err: any) {
          console.error('[GamePlay] Failed to auto-create game session:', err?.message || err);
          const backendCode = err?.response?.data?.code || err?.code;
          if (backendCode === 'SESSION_NOT_ACTIVE') {
            showError(
              err,
              t(
                'games.errors.sessionNotActive',
                'Cannot start a game because the event is not active yet. Ask your workspace admin or host to start the event first.',
              ),
            );
          } else if (backendCode === 'INSUFFICIENT_PERMISSIONS' || backendCode === 'FORBIDDEN') {
            showError(
              err,
              t(
                'games.errors.notAuthorizedToStart',
                'Only event admins or moderators can start this game. Ask your facilitator to launch it for the group.',
              ),
            );
          } else if (backendCode === 'NOT_A_MEMBER') {
            showError(
              err,
              t(
                'games.errors.notMember',
                'You are not a member of this workspace for this event. Please contact your admin if this feels wrong.',
              ),
            );
          } else {
            showError(
              err,
              t(
                'games.errors.genericStartFailed',
                'Failed to start the game session. Please try again or ask your host to start it for you.',
              ),
            );
          }
          return;
        }
      }

      if (!sid) {
        console.warn('[GamePlay] onEmitAction aborted — no sessionId resolved', {
          gameKey: config.gameTypeKey,
          actionType,
        });
        return;
      }

      const ack = await gamesSocket.emit('game:action', {
        sessionId: sid,
        roundId: activeRoundId || undefined,
        actionType,
        payload: payload || {},
      });
      console.log('[GamePlay] game:action ack', {
        actionType,
        sessionId: sid,
        ack,
      });
    },
    [
      activeRoundId,
      config.gameTypeKey,
      eventId,
      gamesSocket,
      sessionId,
      setActiveRoundId,
      setGameData,
      setInitialSnapshot,
      setSessionId,
      showError,
    ],
  );

  switch (config.gameTypeKey) {
    case GAME_TYPES.TWO_TRUTHS:
      return (
        <TwoTruthsBoard
          {...boardProps}
          sessionId={sessionId}
          activeRoundId={activeRoundId}
          initialSnapshot={initialSnapshot}
          gameData={gameData}
          onEmitAction={onEmitAction}
          isAdmin={isGameAdmin}
        />
      );
    case GAME_TYPES.COFFEE_ROULETTE:
      return (
        <CoffeeRouletteBoard
          participants={participants}
          currentUserId={participantId || ''}
          initialSnapshot={initialSnapshot}
          gameData={gameData}
          onEmitAction={onEmitAction}
          gamesSocket={gamesSocket}
        />
      );
    case GAME_TYPES.WINS_OF_WEEK:
      return (
        <WinsOfTheWeekBoard
          prompt={config.promptKey ? t(config.promptKey) : undefined}
          currentUserId={participantId || ''}
          currentUserName={currentUserName || ''}
          currentUserAvatar={(currentUserName || '??').slice(0, 2).toUpperCase()}
          currentUserAvatarUrl={currentUserAvatarUrl}
          posts={winsPosts}
          canPost={canPostWins}
          canReact={!winsPostingClosed}
          endsAt={winsEndTimeIso || undefined}
          postingClosed={!!winsPostingClosed}
          onPost={async (content: string) => {
            if (!eventId || !postParticipantId || !canPostWins) return;
            try {
              await eventsApi.createPost(eventId, postParticipantId, content);
              await refetchPosts();
            } catch (err: any) {
              const code = err?.response?.data?.code || err?.code;
              if (code === 'EVENT_ENDED') {
                toast.error(t('errors.eventEnded', { defaultValue: 'This activity has ended. Posting is now closed.' }));
              } else {
                showError(err, t('errors.postFailed', { defaultValue: 'Failed to post. Please try again.' }));
              }
            }
          }}
          onToggleReaction={async (postId: string, reactionType: string) => {
            if (!postParticipantId || winsPostingClosed) return;
            try {
              await postsApi.react(postId, postParticipantId, reactionType, eventId || undefined);
              await refetchPosts();
            } catch (err: any) {
              const code = err?.response?.data?.code || err?.code;
              if (code === 'EVENT_ENDED') {
                toast.error(t('errors.eventEnded', { defaultValue: 'This activity has ended. Posting is now closed.' }));
              } else {
                showError(err, t('errors.reactionFailed', { defaultValue: 'Failed to react. Please try again.' }));
              }
            }
          }}
        />
      );
    case GAME_TYPES.STRATEGIC_ESCAPE:
      return (
        <StrategicEscapeBoard
          participants={participants}
          currentUserId={participantId || ''}
          currentUserName={currentUserName || undefined}
          currentUserAvatar={(currentUserName || '??').slice(0, 2).toUpperCase()}
          currentUserAvatarUrl={currentUserAvatarUrl}
          eventId={eventId || ''}
          sessionId={sessionId}
          initialSnapshot={initialSnapshot}
          gameData={gameData}
          onSessionCreated={(newSessionId: string) => {
            setSessionId(newSessionId);
          }}
          onEmitSocketAction={onEmitAction}
        />
      );
    case GAME_TYPES.TRIVIA:
    case GAME_TYPES.SCAVENGER_HUNT:
    case GAME_TYPES.GRATITUDE:
      return (
        <ComingSoonBoard
          gameName={t(GAME_CONFIGS[GAME_KEY_TO_CONFIG_ID[config.gameTypeKey]].titleKey)}
          onBack={() => {
            window.history.back();
          }}
        />
      );
    default:
      return (
        <TwoTruthsBoard
          {...boardProps}
          sessionId={sessionId}
          activeRoundId={activeRoundId}
          initialSnapshot={initialSnapshot}
          gameData={gameData}
          onEmitAction={onEmitAction}
        />
      );
  }
}

