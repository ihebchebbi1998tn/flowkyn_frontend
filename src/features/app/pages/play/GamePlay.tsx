import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { GamePlayShell } from '@/features/app/components/game/shell';
import type { GameParticipant } from '@/features/app/components/game/shell';
import { TwoTruthsBoard, CoffeeRouletteBoard, WinsOfTheWeekBoard } from '@/features/app/components/game/boards';
import { EventChat, type ChatMessage } from '@/features/app/components/chat/EventChat';
import { UserProfileSetup, type ProfileSetupData } from '@/features/app/components/auth/UserProfileSetup';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { ROUTES } from '@/constants/routes';
import { useEventPublicInfo, useEventParticipants, useEventMessages, useEventPosts } from '@/hooks/queries/useEventQueries';
import { useEventIdentity } from '@/hooks/useEventIdentity';
import { gamesApi } from '@/features/app/api/games';
import { useEventsSocket, useGamesSocket } from '@/hooks/useSocket';
import { useAuth } from '@/features/app/context/AuthContext';
import { eventsApi } from '@/features/app/api/events';
import { postsApi } from '@/features/app/api/posts';

// ─── Profile helpers (same keys as EventLobby) ────────────────────────────────
const profileKey = (eventId: string) => `event_profile_${eventId}`;

function getStoredProfile(eventId: string): ProfileSetupData | null {
  try {
    const raw = localStorage.getItem(profileKey(eventId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveProfile(eventId: string, data: ProfileSetupData) {
  localStorage.setItem(profileKey(eventId), JSON.stringify(data));
}

// ─── Game Types & Phases ───────────────────────────────────────────────────
export const GAME_TYPES = {
  TWO_TRUTHS: 'two-truths',
  COFFEE_ROULETTE: 'coffee-roulette',
  WINS_OF_WEEK: 'wins-of-week',
} as const;

export type GameTypeKey = typeof GAME_TYPES[keyof typeof GAME_TYPES];

// ─── Game type configs ─────────────────────────────────────────────────────
const GAME_CONFIGS: Record<string, {
  titleKey: string;
  subtitleKey: string;
  type: 'sync' | 'async';
  gameTypeKey: GameTypeKey;
  promptKey?: string;
}> = {
  '1': { titleKey: 'gamePlay.configs.twoTruthsTitle', subtitleKey: 'gamePlay.configs.twoTruthsSubtitle', type: 'sync', gameTypeKey: GAME_TYPES.TWO_TRUTHS },
  '2': { titleKey: 'gamePlay.configs.coffeeRouletteTitle', subtitleKey: 'gamePlay.configs.coffeeRouletteSubtitle', type: 'sync', gameTypeKey: GAME_TYPES.COFFEE_ROULETTE },
  '3': { titleKey: 'gamePlay.configs.winsOfWeekTitle', subtitleKey: 'gamePlay.configs.winsOfWeekSubtitle', type: 'async', gameTypeKey: GAME_TYPES.WINS_OF_WEEK, promptKey: 'gamePlay.configs.defaultPrompt' },
};

function GamePlayWithoutBoundary() {
  const { id: eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const gameTypeId = searchParams.get('game') || '1';
  const config = GAME_CONFIGS[gameTypeId] || GAME_CONFIGS['1'];

  // ─── Current user identity (server-driven) ─────────────────────────────────
  const identity = useEventIdentity(eventId || undefined);
  const { isGuest, userId: currentUserId, participantId, displayName, avatarUrl } = identity;

  const guestParticipantId = isGuest ? participantId : null;
  const memberParticipantId = !isGuest ? participantId : null;
  // ─── Profile (avatar + nickname) ───────────────────────────────────────────
  const initialProfile: ProfileSetupData | null = displayName
    ? { displayName, avatarUrl: avatarUrl || '' }
    : eventId
      ? getStoredProfile(eventId)
      : null;

  const [profile, setProfile] = useState<ProfileSetupData | null>(initialProfile);
  const [showProfileEdit, setShowProfileEdit] = useState(() => !initialProfile);

  const currentUserName = profile?.displayName || displayName;
  const currentUserAvatarUrl = profile?.avatarUrl || avatarUrl;

  const handleProfileSave = useCallback((data: ProfileSetupData) => {
    if (!eventId) return;
    saveProfile(eventId, data);
    setProfile(data);
    setShowProfileEdit(false);
  }, [eventId]);

  // ─── Real data from API ────────────────────────────────────────────────────
  const { data: eventData } = useEventPublicInfo(eventId || '');
  const { data: participantsData, refetch: refetchParticipants } = useEventParticipants(eventId || '');
  const { data: messagesData, refetch: refetchMessages } = useEventMessages(eventId || '');
  const { data: postsData, refetch: refetchPosts } = useEventPosts(eventId || '');

  const eventPublicObj = eventData as any;

  // Map API participants to GameParticipant shape
  const rawParticipants = (participantsData as any)?.data || [];
  const participants: GameParticipant[] = rawParticipants.map((p: any) => ({
    id: p.id,
    name: p.name || 'Unknown',
    email: p.email || null,
    avatar: (p.name || '??').slice(0, 2).toUpperCase(),
    avatarUrl: p.avatar || null,
    status: 'joined' as const,
    joinedAt: p.joined_at || null,
    score: 0,
  }));

  // ─── Chat messages (persistent API load + live WebSocket) ─────────────────
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);

  const rawMessages = (messagesData as any)?.data || [];
  const initialMessages: ChatMessage[] = rawMessages.map((m: any) => ({
    id: m.id,
    // For authenticated users: server stores user_id (real user ID). For guests: no user_id.
    userId: m.user_id || m.participant_id,
    participantId: m.participant_id,
    senderName: m.user_name || m.guest_name || 'Unknown',
    senderAvatar: (m.user_name || m.guest_name || '??').slice(0, 2).toUpperCase(),
    senderAvatarUrl: m.avatar_url || null,
    message: m.message,
    timestamp: m.created_at,
    // isOwn: compare against user.id for auth users, guest participant ID for guests
    isOwn: isGuest
      ? m.participant_id === guestParticipantId
      : !!(m.user_id && m.user_id === user?.id),
  }));

  // Merge initial (from API) + live (from WebSocket) — deduplicate by id
  const seenIds = new Set<string>();
  const allMessages = [...initialMessages, ...liveMessages].filter(m => {
    if (seenIds.has(m.id)) return false;
    seenIds.add(m.id);
    return true;
  });

  // ─── WebSocket: Events namespace (chat) ────────────────────────────────────
  const eventsSocket = useEventsSocket({
    // Pass eventId so the socket hook can resolve the correct per-event guest token
    eventId: eventId || undefined,
    onConnect: () => {
      if (eventId) {
        eventsSocket.emit('event:join', { eventId })
          .then((ack: any) => {
            if (ack?.data?.participantId) {
              if (isGuest) {
                localStorage.setItem(`guest_participant_id_${eventId}`, ack.data.participantId);
              } else {
                localStorage.setItem(`member_participant_id_${eventId}`, ack.data.participantId);
              }
            }
          })
          .catch(err => {
            console.error('[GamePlay] Failed to join event room:', err.message);
          });
      }
    },
  });

  // Listen for incoming chat messages
  const liveMessagesRef = useRef(liveMessages);
  liveMessagesRef.current = liveMessages;

  useEffect(() => {
    if (!eventsSocket.isConnected) {
      console.log('[GamePlay] Chat listener: socket not connected');
      return;
    }

    console.log('[GamePlay] Setting up chat message listener for eventId:', eventId);

    const handleChatMessage = (data: any) => {
      console.log('[GamePlay] Received chat message:', data);
      const name = data.senderName || 'Player';
      // Server sends: userId (real user ID for auth users) and participantId (UUID for all)
      // isOwn for auth users: compare data.userId with user?.id
      // isOwn for guests: compare data.participantId with guestParticipantId
      const isOwn = isGuest
        ? data.participantId === guestParticipantId
        : !!(data.userId && data.userId === user?.id);
      const msg: ChatMessage = {
        id: data.id || `ws-${crypto.randomUUID()}`,
        userId: data.userId,
        participantId: data.participantId,
        senderName: name,
        senderAvatar: name.slice(0, 2).toUpperCase(),
        senderAvatarUrl: getSafeImageUrl(data.senderAvatarUrl) || null,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        isOwn,
      };
      setLiveMessages(prev => [...prev, msg]);
    };

    const unsub = eventsSocket.on('chat:message', handleChatMessage);
    return unsub;
  }, [eventsSocket.isConnected, currentUserId, eventId]); // Added eventId to deps

  // Cleanup: leave event room on unmount
  useEffect(() => {
    return () => {
      // Always safely check if we can emit. We remove isConnected from deps 
      // of the effect itself so it doesn't re-run/re-leave rapidly on reconnects,
      // but we use the socket ref's current state inside the cleanup.
      if (eventId && eventsSocket.socket?.connected) {
        eventsSocket.socket.emit('event:leave', { eventId });
      }
    };
  }, [eventId, eventsSocket.socket]);

  // ─── WebSocket: Games namespace ────────────────────────────────────────────
  const gamesSocket = useGamesSocket({
    // Use eventId so guests can authenticate with their per-event guest token
    eventId: eventId || undefined,
  });

  // ─── Async game data: activity posts (Wins of the Week) ─────────────────────
  const rawPosts = (postsData as any)?.data || [];

  const postParticipantId = guestParticipantId || memberParticipantId || null;
  const canPostWins = !!postParticipantId;

  const winsPosts = rawPosts.map((p: any) => ({
    id: p.id,
    authorName: p.author_name,
    authorAvatar: (p.author_avatar || p.author_name || '??').slice(0, 2).toUpperCase(),
    content: p.content,
    timestamp: p.created_at,
    reactions: (p.reactions || []).map((r: any) => ({
      type: r.type,
      count: r.count,
      // We don't yet track per-user "reacted" flags server-side; treat all as not-reacted in UI.
      reacted: false,
    })),
  }));

  // ─── Game session resolution (per event + game type) ───────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isResolvingSession, setIsResolvingSession] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const resolveSession = async () => {
      setIsResolvingSession(true);
      try {
        const session = await gamesApi.getActiveSession(eventId, config.gameTypeKey);
        if (!cancelled) {
          setSessionId(session ? session.id : null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.warn('[GamePlay] Failed to resolve active game session:', err?.message || err);
          setSessionId(null);
        }
      } finally {
        if (!cancelled) setIsResolvingSession(false);
      }
    };

    resolveSession();
    return () => { cancelled = true; };
  }, [eventId, config.gameTypeKey]);

  // Join the games namespace room once we have a session and socket is connected
  useEffect(() => {
    if (!sessionId || !gamesSocket.isConnected) return;
    gamesSocket.emit<any>('game:join', { sessionId })
      .then((resp: any) => {
        // resp may be ack.data or full ack depending on socket wrapper
        const data = resp?.data || resp;
        if (data?.activeRoundId) setActiveRoundId(data.activeRoundId);
        if (data?.snapshot) {
          setInitialSnapshot(data.snapshot);
          setGameData(data.snapshot);
        }
        // Ask for latest state snapshot too (in case join ack didn't include it)
        gamesSocket.emit('game:state_sync', { sessionId }).catch(() => {});
      })
      .catch(err => {
        console.error('[GamePlay] Failed to join game session room:', err.message);
      });
  }, [sessionId, gamesSocket.isConnected]);

  // Listen for game snapshots pushed by server
  useEffect(() => {
    if (!gamesSocket.isConnected) return;
    const unsubState = gamesSocket.on('game:state', (payload: any) => {
      const snap = payload?.state?.snapshot;
      const ar = payload?.state?.activeRoundId;
      if (ar) setActiveRoundId(ar);
      if (snap) {
        setInitialSnapshot(snap);
        setGameData(snap);
      }
    });
    const unsubData = gamesSocket.on('game:data', (payload: any) => {
      if (payload?.gameData) setGameData(payload.gameData);
    });
    return () => { unsubState?.(); unsubData?.(); };
  }, [gamesSocket.isConnected]);

  // Reconnect backfill: when events socket reconnects, refetch messages/participants
  const wasEventsConnectedRef = useRef(false);
  useEffect(() => {
    if (eventsSocket.status === 'connected') {
      if (!wasEventsConnectedRef.current) {
        wasEventsConnectedRef.current = true;
        if (eventId) {
          refetchMessages();
          refetchParticipants();
        }
      }
    } else {
      wasEventsConnectedRef.current = false;
    }
  }, [eventsSocket.status, eventId, refetchMessages, refetchParticipants]);

  // Reconnect backfill for games: when games socket reconnects, always issue game:state_sync
  const wasGamesConnectedRef = useRef(false);
  useEffect(() => {
    if (gamesSocket.status === 'connected') {
      if (!wasGamesConnectedRef.current) {
        wasGamesConnectedRef.current = true;
        if (sessionId) {
          gamesSocket.emit('game:state_sync', { sessionId }).catch(() => {});
        }
      }
    } else {
      wasGamesConnectedRef.current = false;
    }
  }, [gamesSocket.status, sessionId, gamesSocket]);

  // ─── Typing state ──────────────────────────────────────────────────────────
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!eventsSocket.isConnected) return;

    const handleTyping = (data: { userId: string; userName?: string; isTyping: boolean }) => {
      if (data.userId === currentUserId) return;
      const displayId = data.userName || data.userId;
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(displayId)) return [...prev, displayId];
        if (!data.isTyping) return prev.filter(u => u !== displayId);
        return prev;
      });
    };

    const unsub = eventsSocket.on('chat:typing', handleTyping);
    return unsub;
  }, [eventsSocket.isConnected, currentUserId]);

  // ─── Send message via WebSocket ────────────────────────────────────────────
  const handleSendMessage = useCallback((message: string) => {
    if (eventsSocket.isConnected && eventId) {
      console.log('[GamePlay] Sending message to eventId:', eventId, 'message:', message);
      eventsSocket.emit('chat:message', { eventId, message })
        .catch(err => {
          console.error('[GamePlay] Failed to send message:', err.message);
        });
    } else {
      console.warn('[GamePlay] Socket not connected, cannot send message — will retry when reconnected.');
    }
  }, [eventsSocket.isConnected, eventId]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (eventsSocket.isConnected && eventId) {
      eventsSocket.emit('chat:typing', { eventId, isTyping });
    }
  }, [eventsSocket.isConnected, eventId]);

  // ─── Chat sidebar ──────────────────────────────────────────────────────────
  const chatSidebar = (
    <div className="space-y-4 sticky top-16">
      <div className="flex items-center justify-between text-label-xs text-muted-foreground px-1">
        <span>
          {eventsSocket.status === 'connected' && t('chat.connected', 'Live & synced')}
          {eventsSocket.status === 'reconnecting' && t('chat.reconnecting', 'Reconnecting…')}
          {eventsSocket.status === 'disconnected' && !eventsSocket.isConnected && t('chat.offline', 'Offline')}
        </span>
        {eventsSocket.status === 'disconnected' && !eventsSocket.isConnected && (
          <button
            type="button"
            onClick={() => eventsSocket.connect()}
            className="text-label-xs text-primary hover:underline"
          >
            {t('chat.retry', 'Retry')}
          </button>
        )}
      </div>
      <EventChat
        eventId={eventId || ''}
        messages={allMessages}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        currentUserId={currentUserId}
        currentUserAvatarUrl={currentUserAvatarUrl}
        typingUsers={typingUsers}
        isOnline={eventsSocket.status === 'connected'}
      />
    </div>
  );

  // ─── Game board ────────────────────────────────────────────────────────────
  const renderBoard = () => {
    const boardProps = {
      participants,
      currentUserId,
      currentUserName,
      currentUserAvatar: (currentUserName || '??').slice(0, 2).toUpperCase(),
      currentUserAvatarUrl,
    };

    const onEmitAction = async (actionType: string, payload?: any) => {
      if (!sessionId) return;
      await gamesSocket.emit('game:action', {
        sessionId,
        roundId: activeRoundId || undefined,
        actionType,
        payload: payload || {},
      });
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
          />
        );
      case GAME_TYPES.COFFEE_ROULETTE:
        return (
          <CoffeeRouletteBoard
            participants={participants}
            currentUserId={currentUserId}
            initialSnapshot={initialSnapshot}
            gameData={gameData}
            onEmitAction={onEmitAction}
          />
        );
      case GAME_TYPES.WINS_OF_WEEK:
        return (
          <WinsOfTheWeekBoard
            prompt={config.promptKey ? t(config.promptKey) : undefined}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={(currentUserName || '??').slice(0, 2).toUpperCase()}
            currentUserAvatarUrl={currentUserAvatarUrl}
            posts={winsPosts}
            canPost={canPostWins}
            onPost={async (content: string) => {
              if (!eventId || !postParticipantId) return;
              await eventsApi.createPost(eventId, postParticipantId, content);
              await refetchPosts();
            }}
            onToggleReaction={async (postId: string, reactionType: string) => {
              if (!postParticipantId) return;
              await postsApi.react(postId, postParticipantId, reactionType);
              await refetchPosts();
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
  };

  return (
    <>
      <GamePlayShell
        title={t(config.titleKey)}
        subtitle={t(config.subtitleKey)}
        gameType={config.type}
        eventId={eventId || ''}
        participants={participants}
        onEnd={() => navigate(ROUTES.EVENTS)}
        sidebar={chatSidebar}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatarUrl={currentUserAvatarUrl}
        onEditProfile={() => setShowProfileEdit(true)}
        organizationLogo={eventPublicObj?.organization_logo}
        organizationName={eventPublicObj?.organization_name}
        hideBackButton={true}
      >
        {renderBoard()}
      </GamePlayShell>

      {/* In-game profile edit modal */}
      <AnimatePresence>
        {showProfileEdit && (
          <UserProfileSetup
            asModal
            defaultName={profile?.displayName || currentUserName}
            defaultAvatarUrl={profile?.avatarUrl}
            submitLabel="Save Profile"
            onSubmit={handleProfileSave}
            onClose={profile ? () => setShowProfileEdit(false) : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function GamePlay() {
  return (
    <ErrorBoundary>
      <GamePlayWithoutBoundary />
    </ErrorBoundary>
  );
}
