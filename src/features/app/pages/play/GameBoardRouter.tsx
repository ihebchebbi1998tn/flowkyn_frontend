import { useTranslation } from 'react-i18next';
import { TwoTruthsBoard, WinsOfTheWeekBoard, StrategicEscapeBoard, ComingSoonBoard } from '@/features/app/components/game/boards';
import { CoffeeRouletteBoard } from '@/features/app/components/game/coffee-roulette';
import type { GameParticipant } from '@/features/app/components/game/shell';
import { eventsApi } from '@/features/app/api/events';
import { postsApi } from '@/features/app/api/posts';
import type { GameTypeKey } from './gameTypes';
import { GAME_TYPES, GAME_CONFIGS, GAME_KEY_TO_CONFIG_ID } from './gameTypes';
import { toast } from 'sonner';
import type { ActivityFeedbackSource } from '@/features/app/api/activityFeedbacks';
import { useGameActionEmitter } from '@/hooks/useGameActionEmitter';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

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
  initialSnapshot: unknown;
  setInitialSnapshot: (snap: unknown) => void;
  gameData: unknown;
  setGameData: (data: unknown) => void;
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
  refetchPosts: () => Promise<unknown>;
  gamesSocket: ReturnType<typeof import('@/hooks/useSocket')['useGamesSocket']>;
  showError: (err: unknown, label?: string) => void;
  onRequestActivityExitWithFeedback: (source: ActivityFeedbackSource) => void;
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
  onRequestActivityExitWithFeedback,
}: GameBoardRouterProps) {
  const { t } = useTranslation();

  const onEmitAction = useGameActionEmitter({
    gameTypeKey: config.gameTypeKey,
    eventId,
    sessionId,
    activeRoundId,
    setSessionId,
    setActiveRoundId,
    setInitialSnapshot,
    setGameData,
    gamesSocket,
    showError,
  });

  const boardProps = {
    participants,
    currentUserId: participantId || '',
    currentUserName: currentUserName || undefined,
    currentUserAvatar: (currentUserName || '??').slice(0, 2).toUpperCase(),
    currentUserAvatarUrl,
    // Some boards may display a round number; do not pass roundId UUIDs here.
    round: (isRecord(gameData) && typeof gameData.round === 'number')
      ? gameData.round
      : ((isRecord(initialSnapshot) && typeof initialSnapshot.round === 'number') ? initialSnapshot.round : 1),
    onRoundComplete: () => {},
  };

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
          sessionId={sessionId}
          eventId={eventId}
          initialSnapshot={initialSnapshot}
          gameData={gameData}
          onEmitAction={onEmitAction}
          gamesSocket={gamesSocket}
          onRequestActivityExitWithFeedback={onRequestActivityExitWithFeedback}
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
            } catch (err: unknown) {
              const code = (err as any)?.response?.data?.code || (err as any)?.code;
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
            } catch (err: unknown) {
              const code = (err as any)?.response?.data?.code || (err as any)?.code;
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

