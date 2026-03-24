import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { GamePlayShell } from '@/features/app/components/game/shell';
import type { GameParticipant } from '@/features/app/components/game/shell';
import { EventChat, type ChatMessage } from '@/features/app/components/chat/EventChat';
import { UserProfileSetup, type ProfileSetupData } from '@/features/app/components/auth/UserProfileSetup';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { getStoredEventProfile, saveEventProfile } from '@/lib/eventProfileStorage';
import { useGamePlayJoin } from '@/hooks/useGamePlayJoin';
import { useGamePlayEventRoom } from '@/hooks/useGamePlayEventRoom';
import { ROUTES } from '@/constants/routes';
import { useEventPublicInfo, useEventParticipants, useEventMessages, useEventPosts, useJoinEvent, useJoinAsGuest, useAcceptEventInvitation } from '@/hooks/queries/useEventQueries';
import { useEventIdentity } from '@/hooks/useEventIdentity';
import { hasEventToken } from '@/hooks/queries/useMyEventParticipant';
import { setGuestToken, getGuestToken, getOrCreateGuestIdentityKey, getGuestIdentityKey } from '@/lib/guestTokenPersistence';
import { useUpsertEventProfile } from '@/hooks/queries/useEventProfile';
import { useParticipantProfileRealtimeSync } from '@/hooks/useParticipantProfileRealtimeSync';
import { useGameChatState } from '@/hooks/useGameChatState';
import { useGameStateSync } from '@/hooks/useGameStateSync';
import { useParticipantPresenceSync } from '@/hooks/useParticipantPresenceSync';
import { useEventsSocket, useGamesSocket } from '@/hooks/useSocket';
import { useEventVoiceChat } from '@/hooks/useEventVoiceChat';
import { useAuth } from '@/features/app/context/AuthContext';
import { useApiError } from '@/hooks/useApiError';
import { eventsApi } from '@/features/app/api/events';
import { gamesApi } from '@/features/app/api/games';
import { GameBoardRouter } from './GameBoardRouter';
import { GAME_CONFIGS, GAME_KEY_TO_CONFIG_ID } from './gameTypes';
import { useSetGameHeader } from '@/features/app/layouts/gameHeaderContext';
import { ActivityFeedbackModal } from '@/features/app/components/game/shared/ActivityFeedbackModal';
import type { ActivityFeedbackSource } from '@/features/app/api/activityFeedbacks';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function getDataArray(v: unknown): unknown[] {
  if (isRecord(v) && Array.isArray(v.data)) return v.data as unknown[];
  return [];
}

// GAME_CONFIGS and GAME_TYPES live in ./gameTypes to keep this file smaller.

function GamePlayWithoutBoundary() {
  const { id: eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useApiError();
  const setGameHeader = useSetGameHeader();

  const rawGameParam = searchParams.get('game') || '1';
  // Accept both numeric config IDs ('1','2'...) and game-type keys ('coffee-roulette'...).
  // The backend individual-invite flow auto-detects from DB and sends the key string;
  // LaunchActivity sends the numeric ID. Support both so links always land on the right game.
  const gameTypeId = GAME_CONFIGS[rawGameParam]
    ? rawGameParam
    : (GAME_KEY_TO_CONFIG_ID[rawGameParam as keyof typeof GAME_KEY_TO_CONFIG_ID] ?? '1');
  const urlConfig = GAME_CONFIGS[gameTypeId] ?? GAME_CONFIGS['1'];

  // ─── Current user identity (server-driven) ─────────────────────────────────
  const identity = useEventIdentity(eventId || undefined);
  const { isGuest, userId: currentUserId, participantId, displayName, avatarUrl, isLoading: isIdentityLoading } = identity;

  // We start with the URL param config, but will update it if the server tells us a different game is active.
  const [activeConfig, setActiveConfig] = useState(urlConfig);

  const guestParticipantId = isGuest ? participantId : null;
  const memberParticipantId = !isGuest ? participantId : null;
  // ─── Profile (avatar + nickname) ───────────────────────────────────────────
  const storedProfile = eventId ? getStoredEventProfile(eventId) : null;
  const initialProfile: ProfileSetupData | null = storedProfile
    ? {
        // Prefer the locally saved profile whenever it exists,
        // because server-backed identity may be missing avatar/name on reload.
        displayName: storedProfile.displayName || displayName || 'Guest',
        avatarUrl: storedProfile.avatarUrl || avatarUrl || '',
      }
    : displayName
      ? { displayName, avatarUrl: avatarUrl || '' }
      : null;

  const [profile, setProfile] = useState<ProfileSetupData | null>(initialProfile);
  const [showProfileEdit, setShowProfileEdit] = useState(() => !initialProfile);

  // Activity feedback modal (rate + comment) when user exits/ends an activity.
  const [showActivityFeedback, setShowActivityFeedback] = useState(false);
  const [activityFeedbackSource, setActivityFeedbackSource] = useState<ActivityFeedbackSource>('end_clicked');

  const [guestEmail, setGuestEmail] = useState('');
  const joinEvent = useJoinEvent();
  const joinAsGuest = useJoinAsGuest();
  const acceptInvitation = useAcceptEventInvitation();
  const upsertProfile = useUpsertEventProfile(eventId || undefined);
  const inviteToken = searchParams.get('token');
  const { isAuthenticated } = useAuth();

  const { hasJoined, setHasJoined, isJoining, joinError, handleJoin } = useGamePlayJoin({
    eventId: eventId || null,
    profile,
    participantId: participantId || null,
    isIdentityLoading,
    showProfileEdit,
    isAuthenticated,
    user: user || null,
    inviteToken,
    guestEmail,
    joinEvent,
    joinAsGuest,
    acceptInvitation,
    getOrCreateGuestIdentityKey,
    setGuestToken,
    tJoinFailed: t('event.joinFailed', { defaultValue: 'Failed to join event' }),
  });

  const identityRef = useRef(identity);
  const userRef = useRef(user);
  useEffect(() => {
    identityRef.current = identity;
    userRef.current = user;
  }, [identity, user]);

  const currentUserName = profile?.displayName || displayName;
  const currentUserAvatarUrl = profile?.avatarUrl || avatarUrl;

  const handleProfileSave = useCallback(async (data: ProfileSetupData) => {
    if (!eventId) return;
    await upsertProfile.mutateAsync({ display_name: data.displayName, avatar_url: data.avatarUrl || null });
    saveEventProfile(eventId, data);
    setProfile(data);
  }, [eventId, upsertProfile]);

  const requestActivityExitWithFeedback = useCallback((source: ActivityFeedbackSource) => {
    setActivityFeedbackSource(source);
    setShowActivityFeedback(true);
  }, []);

  const onFeedbackSubmitted = useCallback(() => {
    // Leaving the game should return to the event lobby (focused/join route),
    // not the authenticated dashboard (/events). This prevents guests from
    // being redirected to login/landing pages.
    if (!eventId) return navigate(ROUTES.EVENTS);
    navigate(ROUTES.EVENT_LOBBY(eventId));
  }, [navigate, eventId]);

  // Ensure the server profile is restored from localStorage after reload.
  // Without this, server-backed identity can return avatar/name as empty (e.g. for guests),
  // causing other users (and the local UI) to appear like a brand-new participant.
  const autoUpsertKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!eventId) return;
    if (isIdentityLoading) return;
    if (!hasJoined) return;
    if (!profile) return;

    const storedKey = `${profile.displayName}::${profile.avatarUrl || ''}`;
    if (autoUpsertKeyRef.current === storedKey) return;

    const serverName = (displayName || '').trim();
    const serverAvatar = (avatarUrl || '').trim();

    const needsUpsert =
      serverName !== profile.displayName.trim() ||
      serverAvatar !== (profile.avatarUrl || '').trim();

    if (!needsUpsert) return;

    autoUpsertKeyRef.current = storedKey;
    void upsertProfile
      .mutateAsync({ display_name: profile.displayName, avatar_url: profile.avatarUrl || null })
      .catch((err) => {
        console.warn('[GamePlay] auto upsert profile failed (will allow retry on next render)', err);
        autoUpsertKeyRef.current = null;
      });
  }, [eventId, isIdentityLoading, hasJoined, profile, displayName, avatarUrl, upsertProfile]);

  // ─── Real data from API ────────────────────────────────────────────────────
  const { data: eventData } = useEventPublicInfo(eventId || '');
  const { data: participantsData, refetch: refetchParticipants } = useEventParticipants(eventId || '');
  const canFetchParticipantData = hasEventToken(eventId || undefined) && (!!participantId || hasJoined);
  const { data: messagesData, refetch: refetchMessages } = useEventMessages(eventId || '', 1, 50, canFetchParticipantData);
  const { data: postsData, refetch: refetchPosts } = useEventPosts(eventId || '', 1, 50, canFetchParticipantData);

  const eventPublicObj: Record<string, unknown> | null = isRecord(eventData) ? (eventData as Record<string, unknown>) : null;

  // Map API participants to GameParticipant shape (dedupe by id to avoid any duplicates)
  const rawParticipants = getDataArray(participantsData);
  const seenParticipantIds = new Set<string>();
  const participants: GameParticipant[] = rawParticipants
    .filter((p) => {
      if (!isRecord(p) || typeof p.id !== 'string') return false;
      if (seenParticipantIds.has(p.id)) return false;
      seenParticipantIds.add(p.id);
      return true;
    })
    .map((p) => ({
      // API payloads vary by endpoint/socket shape; normalize avatar from known fields.
      avatarUrl:
        typeof (p as any).avatarUrl === 'string' ? (p as any).avatarUrl :
        typeof (p as any).avatar_url === 'string' ? (p as any).avatar_url :
        typeof (p as any).avatar === 'string' ? (p as any).avatar :
        typeof (p as any).user_avatar === 'string' ? (p as any).user_avatar :
        typeof (p as any).custom_avatar_url === 'string' ? (p as any).custom_avatar_url :
        typeof (p as any).guest_avatar === 'string' ? (p as any).guest_avatar :
        null,
      id: String((p as any).id),
      name: typeof (p as any).name === 'string' && (p as any).name ? (p as any).name : t('common.unknown', { defaultValue: 'Unknown' }),
      email: typeof (p as any).email === 'string' ? (p as any).email : null,
      avatar: (typeof (p as any).name === 'string' && (p as any).name ? (p as any).name : '??').slice(0, 2).toUpperCase(),
      status: 'joined' as const,
      joinedAt: typeof (p as any).joined_at === 'string' ? (p as any).joined_at : null,
      score: 0,
      isHost: !!(p as any).is_host,
    }));

  // ─── Chat messages (persistent API load + live WebSocket) ─────────────────

  // ─── Game session state (moved up for use in callbacks) ────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isResolvingSession, setIsResolvingSession] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<unknown>(null);
  const [gameData, setGameData] = useState<unknown>(null);
  const [isGameAdmin, setIsGameAdmin] = useState<boolean>(false);

  // Log gameData changes for debugging
  useEffect(() => {
    console.log('[GamePlay] gameData changed:', {
      kind: (gameData as any)?.kind,
      phase: (gameData as any)?.phase,
      pairCount: (gameData as any)?.pairs?.length,
      hasGameData: !!gameData,
    });
  }, [gameData]);

  // ─── Socket error state ───────────────────────────────────────────────────
  const [chatSocketError, setChatSocketError] = useState<string | null>(null);
  const [chatSocketErrorCode, setChatSocketErrorCode] = useState<string | null>(null);
  const [chatSocketErrorDetails, setChatSocketErrorDetails] = useState<unknown>(null);
  const [gamesSocketError, setGamesSocketError] = useState<string | null>(null);
  const [gamesSocketErrorCode, setGamesSocketErrorCode] = useState<string | null>(null);
  const [gamesSocketErrorDetails, setGamesSocketErrorDetails] = useState<unknown>(null);
  const [gameJoinAckReceived, setGameJoinAckReceived] = useState(false);

  // ─── WebSocket: Events namespace (chat) ────────────────────────────────────
  const eventsSocket = useEventsSocket({
    // Pass eventId so the socket hook can resolve the correct per-event guest token
    eventId: eventId || undefined,
    autoConnect: false,
    authMode: isGuest ? 'guest' : 'access',
    onError: (e) => {
      const exact = (e as any)?.message || (e as any)?.code || t('chat.errors.generic', { defaultValue: 'Chat error' });
      setChatSocketError(String(exact));
      setChatSocketErrorCode((e as any)?.code ? String((e as any).code) : null);
      setChatSocketErrorDetails((e as any)?.details ?? null);
      showError(e, String(exact));
    },
  });

  const gamesSocket = useGamesSocket({
    // Use eventId so guests can authenticate with their per-event guest token
    eventId: eventId || undefined,
    autoConnect: false,
    authMode: isGuest ? 'guest' : 'access',
    onError: (e) => {
      const exact = (e as any)?.message || (e as any)?.code || t('gamePlay.errors.socket', { defaultValue: 'Game connection error' });
      setGamesSocketError(String(exact));
      setGamesSocketErrorCode((e as any)?.code ? String((e as any).code) : null);
      setGamesSocketErrorDetails((e as any)?.details ?? null);
      showError(e, String(exact));
    },
  });

  useEffect(() => {
    if (eventsSocket.status === 'connected') {
      setChatSocketError(null);
      setChatSocketErrorCode(null);
      setChatSocketErrorDetails(null);
    }
  }, [eventsSocket.status]);

  useEffect(() => {
    if (gamesSocket.status === 'connected') {
      setGamesSocketError(null);
      setGamesSocketErrorCode(null);
      setGamesSocketErrorDetails(null);
    }
  }, [gamesSocket.status]);

  // 3. Ensure socket connects when joined
  useEffect(() => {
    if (!isIdentityLoading && hasJoined && !eventsSocket.isConnected && eventsSocket.status === 'disconnected') {
      eventsSocket.connect();
    }
  }, [hasJoined, eventsSocket, isIdentityLoading]);

  // Ensure games socket also connects when joined (for game states)
  useEffect(() => {
    if (!isIdentityLoading && hasJoined && !gamesSocket.isConnected && gamesSocket.status === 'disconnected') {
      gamesSocket.connect();
    }
  }, [hasJoined, gamesSocket, isIdentityLoading]);

  // ─── Event room join (with retries) ───────────────────────────────────────
  const { eventRoomJoined } = useGamePlayEventRoom({
    eventsSocket,
    eventId: eventId || null,
    hasJoined,
    participantId: participantId || null,
    isGuest,
    setChatSocketError,
    setChatSocketErrorCode,
    setChatSocketErrorDetails,
    showError,
    refetchMessages,
    tJoinRoomFailed: t('events.errors.joinRoomFailed', { defaultValue: 'Failed to join event room' }),
  });

  const { allMessages, initialMessages, liveMessages, pinnedMessage, setPinnedMessage } = useGameChatState({
    eventId: eventId || undefined,
    messagesData,
    isGuest,
    guestParticipantId,
    userId: user?.id,
    tUnknown: t('common.unknown', { defaultValue: 'Unknown' }),
    eventsSocket,
    identityRef,
    userRef,
  });

  // ─── Voice chat state ─────────────────────────────────────────────────────
  const {
    status: voiceStatus,
    error: voiceError,
    isMuted,
    remoteParticipants,
    voiceStatuses,
    startVoice,
    stopVoice,
    toggleMute,
  } = useEventVoiceChat({
    eventId: eventId || '',
    myParticipantId: participantId || '',
    eventsSocket,
  });

  // ─── Async game data: activity posts (Wins of the Week) ─────────────────────
  const rawPosts = (postsData as any)?.data || [];

  const postParticipantId = guestParticipantId || memberParticipantId || null;
  const winsEndTimeIso: string | null = (eventPublicObj?.end_time as any) || null;
  const winsEndsAtMs = useMemo(() => {
    if (!winsEndTimeIso) return null;
    const ms = new Date(winsEndTimeIso).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [winsEndTimeIso]);

  const [winsNowTick, setWinsNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!winsEndsAtMs) return;
    const interval = setInterval(() => setWinsNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [winsEndsAtMs]);

  const winsPostingClosed = !!winsEndsAtMs && winsNowTick >= winsEndsAtMs;
  const canPostWins = !!postParticipantId && !winsPostingClosed;

  const winsPosts = rawPosts.map((p: any) => ({
    id: p.id,
    authorName: p.author_name,
    authorAvatar: (p.author_name || '??').slice(0, 2).toUpperCase(),
    authorAvatarUrl: getSafeImageUrl(p.author_avatar) || null,
    content: p.content,
    timestamp: p.created_at,
    reactions: (p.reactions || []).map((r: any) => ({
      type: r.type,
      count: r.count,
      reacted: !!r.reacted,
    })),
  }));

  // Resolve active game session on mount + periodically when none (in case we miss game:session_created)
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const resolveSession = async () => {
      try {
        const session = await gamesApi.getActiveSession(eventId);
        if (!cancelled && session) {
          setSessionId(session.id);
          if (session.game_type_key) {
            import('./gameTypes').then(({ GAME_KEY_TO_CONFIG_ID, GAME_CONFIGS }) => {
              if (!cancelled) {
                const correctConfigId = GAME_KEY_TO_CONFIG_ID[session.game_type_key as keyof typeof GAME_KEY_TO_CONFIG_ID];
                if (correctConfigId && GAME_CONFIGS[correctConfigId]) {
                  setActiveConfig(GAME_CONFIGS[correctConfigId]);
                }
              }
            });
          }
        } else if (!cancelled && !session) {
          setSessionId(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.warn('[GamePlay] Failed to resolve active game session:', err?.message || err);
        }
      }
    };

    setIsResolvingSession(true);
    resolveSession().finally(() => {
      if (!cancelled) setIsResolvingSession(false);
    });

    return () => { cancelled = true; };
  }, [eventId]);

  // Poll for session when we don't have one (guest may have missed game:session_created via socket)
  useEffect(() => {
    if (!eventId || sessionId) return;
    const pollId = setInterval(() => {
      gamesApi.getActiveSession(eventId).then((s: any) => {
        if (s?.id) setSessionId(s.id);
      }).catch(() => {});
    }, 1000);
    return () => clearInterval(pollId);
  }, [eventId, sessionId]);

  // Reconnect backfill: when events socket reconnects, refetch messages/participants/posts
  const wasEventsConnectedRef = useRef(false);
  useEffect(() => {
    if (eventsSocket.status === 'connected') {
      if (!wasEventsConnectedRef.current) {
        wasEventsConnectedRef.current = true;
        if (eventId) {
          refetchMessages();
          refetchParticipants();
          refetchPosts();
        }
      }
    } else {
      wasEventsConnectedRef.current = false;
    }
  }, [eventsSocket.status, eventId, refetchMessages, refetchParticipants, refetchPosts]);

  // Fallback polling: when joined, periodically refetch messages so chat stays in sync
  // (covers both offline recovery and online safety net when room join/events are missed).
  useEffect(() => {
    if (!eventId || !hasJoined) return;
    const interval = setInterval(() => refetchMessages(), 5000);
    return () => clearInterval(interval);
  }, [eventId, hasJoined, refetchMessages]);

  // Participants polling: fallback so Coffee Roulette and other games see new joins
  // even if event:user_joined/participant:joined are missed (e.g. late socket connect)
  useEffect(() => {
    if (!eventId || !hasJoined) return;
    const interval = setInterval(() => {
      refetchParticipants();
    }, 6000);
    return () => clearInterval(interval);
  }, [eventId, hasJoined, refetchParticipants]);

  const { requestStateSync } = useGameStateSync({
    gamesSocket: gamesSocket as any,
    sessionId,
    hasJoined,
    participantId,
    setActiveRoundId,
    setInitialSnapshot,
    setGameData,
    setIsGameAdmin,
    onGameJoinError: (err) => {
      const exact = (err as any)?.message || (err as any)?.code || (err as any)?.error || String(err);
      setGamesSocketError(String(exact));
      setGamesSocketErrorCode((err as any)?.code ? String((err as any).code) : null);
      setGamesSocketErrorDetails((err as any)?.details ?? null);
      showError(err, String(exact));
    },
    onGameJoinAck: () => {
      setGameJoinAckReceived(true);
    },
  });

  // Listen for event notifications (participant join, game session, posts)
  useEffect(() => {
    if (!eventsSocket.isConnected || !eventId) return;

    const handleEventNotification = (data: { type: string; payload: any }) => {
      // Participant joined via API (guest or member) — refetch so we see new arrivals immediately
      if (data.type === 'participant:joined' || data.type === 'participant:left') {
        refetchParticipants();
      }
      if (data.type === 'post:created' || data.type === 'post:reacted') {
        refetchPosts();
      }
      // When someone starts a new game session (e.g. Coffee Roulette), auto-resolve and join it
      // so all participants see the game without refreshing.
      if (data.type === 'game:session_created') {
        const sessionIdFromPayload = data.payload?.sessionId;
        if (sessionIdFromPayload) {
          setSessionId(sessionIdFromPayload);
          // Trigger an immediate state sync after a short delay to allow game:join to complete.
          // This ensures the player gets the latest snapshot right away instead of waiting
          // for the next periodic sync or game:data broadcast.
          setTimeout(() => {
            requestStateSync?.('session_created_notification');
          }, 800);
        } else {
          // Fallback: resolve latest active session from API
          gamesApi.getActiveSession(eventId).then((s: any) => setSessionId(s ? s.id : null)).catch(() => {});
        }
      }
    };

    const unsub = eventsSocket.on('event:notification', handleEventNotification);
    return unsub;
  }, [eventsSocket.isConnected, eventId, refetchParticipants, refetchPosts, requestStateSync]);

  useParticipantProfileRealtimeSync({
    eventId: eventId || undefined,
    participantId,
    refetchParticipants,
    eventsSocket,
    gamesSocket,
    setOwnProfile: setProfile,
    logPrefix: 'GamePlay',
  });

  const { disconnectedBadgeCount } = useParticipantPresenceSync({
    eventId: eventId || undefined,
    sessionId,
    eventsSocket,
    gamesSocket,
    refetchParticipants,
  });

  // Set unified top bar header in FocusedLayout.
  // Important: this must live *after* `eventPublicObj`, `participants`, and `disconnectedBadgeCount`
  // are declared, otherwise we can hit TDZ runtime errors like:
  // "Cannot access 'participants' before initialization".
  useEffect(() => {
    if (!eventId) return;
    const eventTitle =
      eventPublicObj && typeof eventPublicObj.title === 'string'
        ? (eventPublicObj.title as string)
        : t(activeConfig.titleKey);
    const eventSubtitle =
      eventPublicObj && typeof eventPublicObj.description === 'string'
        ? (eventPublicObj.description as string)
        : t(activeConfig.subtitleKey);
    const lobbyModeRaw =
      eventPublicObj && typeof (eventPublicObj as any).event_mode === 'string'
        ? String((eventPublicObj as any).event_mode)
        : null;
    const lobbyGameType: 'sync' | 'async' = lobbyModeRaw === 'sync' ? 'sync' : 'async';
    setGameHeader({
      title: eventTitle,
      subtitle: eventSubtitle,
      gameType: lobbyGameType,
      eventId,
      participants,
      onEnd: () => requestActivityExitWithFeedback('end_clicked'),
      currentUserName,
      currentUserAvatarUrl,
      onEditProfile: () => setShowProfileEdit(true),
      organizationLogo: (eventPublicObj as any)?.organization_logo,
      organizationName: (eventPublicObj as any)?.organization_name,
      disconnectedBadgeCount,
      hideBackButton: true,
    });
    return () => setGameHeader(null);
  }, [
    eventId,
    activeConfig.titleKey,
    activeConfig.subtitleKey,
    participants,
    currentUserName,
    currentUserAvatarUrl,
    navigate,
    requestActivityExitWithFeedback,
    setGameHeader,
    (eventPublicObj as any)?.organization_logo,
    (eventPublicObj as any)?.organization_name,
    (eventPublicObj as any)?.event_mode,
    (eventPublicObj as any)?.title,
    (eventPublicObj as any)?.description,
    disconnectedBadgeCount,
    t,
  ]);


  const chatReady = eventsSocket.status === 'connected' && eventRoomJoined;
  const gamesReady =
    gamesSocket.status === 'connected' && !!sessionId && gameJoinAckReceived;
  useEffect(() => {
    // Reset "ready" when session changes.
    setGameJoinAckReceived(false);
  }, [sessionId]);

  useEffect(() => {
    if (chatReady) setChatSocketError(null);
  }, [chatReady]);

  useEffect(() => {
    if (gamesReady) setGamesSocketError(null);
  }, [gamesReady]);

  // ─── Game state sync from WebSocket ────────────────────────────────────────
  // Listen for real-time game state updates from the backend.
  // This ensures all participants stay synchronized when actions are performed.
  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;

    let mounted = true;

    console.log('[GamePlay] Registering game:data listener', {
      sessionId,
      socketConnected: gamesSocket.isConnected,
      socketId: (gamesSocket as any)?.socket?.id,
    });

    const handleGameData = (data: any) => {
      console.log('[GamePlay] game:data event received (raw):', {
        dataSessionId: data?.sessionId,
        currentSessionId: sessionId,
        mounted,
        hasGameData: !!data?.gameData,
        gameKind: data?.gameData?.kind,
      });

      if (!mounted) {
        console.warn('[GamePlay] Ignoring game:data - component unmounted');
        return;
      }

      if (data.sessionId !== sessionId) {
        console.warn('[GamePlay] Ignoring game:data - session mismatch', {
          dataSessionId: data.sessionId,
          currentSessionId: sessionId,
        });
        return;
      }

      console.log('[GamePlay] Updating gameData state with:', {
        sessionId: data.sessionId,
        gameKind: data.gameData?.kind,
        phase: (data.gameData as any)?.phase,
        pairCount: (data.gameData as any)?.pairs?.length,
        pairs: (data.gameData as any)?.pairs?.map?.((p: any) => ({
          id: p.id,
          person1: p.person1?.participantId,
          person2: p.person2?.participantId,
          topic: p.topic,
        })),
      });

      // Update the parent game data state so all boards see the change
      setGameData(data.gameData);
      console.log('[GamePlay] setGameData() called with', (data.gameData as any)?.pairs?.length, 'pairs');
    };

    const unsub = gamesSocket.on('game:data', handleGameData);
    console.log('[GamePlay] game:data listener registered, unsub:', typeof unsub);

    return () => {
      console.log('[GamePlay] Cleaning up game:data listener');
      mounted = false;
      unsub?.();
    };
  }, [gamesSocket.isConnected, sessionId]);

  // ─── Typing state ──────────────────────────────────────────────────────────
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const lastChatSentAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!eventsSocket.isConnected) return;

    const handleTyping = (data: { userId: string; userName?: string; isTyping: boolean }) => {
      // Ignore our own typing events (accounts for guest synthetic socket userIds)
      if (data.userId === currentUserId || (isGuest && data.userId === `guest:${currentUserId}`)) return;
      const displayId = data.userName || data.userId;
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(displayId)) return [...prev, displayId];
        if (!data.isTyping) return prev.filter(u => u !== displayId);
        return prev;
      });
    };

    const unsub = eventsSocket.on('chat:typing', handleTyping);
    return unsub;
  }, [eventsSocket.isConnected, currentUserId, isGuest]);

  // ─── Send message via WebSocket ────────────────────────────────────────────
  const handleSendMessage = useCallback((message: string) => {
    const now = Date.now();
    if (lastChatSentAtRef.current && now - lastChatSentAtRef.current < 1000) {
      console.warn('[GamePlay] Dropping chat send due to local rate limit');
      return;
    }
    lastChatSentAtRef.current = now;

    if (chatReady && eventsSocket.isConnected && eventId) {
      eventsSocket.emit('chat:message', { eventId, message })
        .then(() => {
          refetchMessages();
        })
        .catch(err => {
          console.error('[GamePlay] Failed to send message:', err.message);
          showError(err, t('chat.errors.sendFailed', { defaultValue: 'Failed to send message' }));
        });
    } else {
      console.warn('[GamePlay] Socket not connected, cannot send message — falling back to HTTP refetch');
      refetchMessages();
    }
  }, [eventsSocket.isConnected, eventId, chatReady, showError, refetchMessages]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (eventsSocket.isConnected && eventId) {
      eventsSocket.emit('chat:typing', { eventId, isTyping });
    }
  }, [eventsSocket.isConnected, eventId]);

  const hostParticipantId = participants.find(p => p.isHost)?.id;

  const handleTogglePinMessage = useCallback(async (messageId: string) => {
    if (!eventId) return;
    try {
      if (pinnedMessage && pinnedMessage.id === messageId) {
        await eventsApi.unpinMessage(eventId);
        setPinnedMessage(null);
      } else {
        await eventsApi.pinMessage(eventId, messageId);
        // Try to find the full message in current history for optimistic UI
        const source = [...initialMessages, ...liveMessages];
        const msg = source.find(m => m.id === messageId);
        if (msg) {
          setPinnedMessage({ ...msg, isOwn: false });
        } else {
          // If not found, leave pinnedMessage as-is; it will refresh on next fetch
        }
      }
    } catch (err: any) {
      console.error('[GamePlay] Failed to toggle pinned message:', err?.message || err);
      showError(err, t('chat.errors.pinFailed', { defaultValue: 'Failed to update pinned message' }));
    }
  }, [eventId, pinnedMessage, initialMessages, liveMessages, showError]);

  // ─── Chat sidebar ──────────────────────────────────────────────────────────
  const chatSidebar = (
    <div className="space-y-3 sticky top-20 h-[calc(100vh-96px)] flex flex-col min-h-0">
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
      <div className="flex-1 min-h-0">
        <EventChat
          eventId={eventId || ''}
          messages={allMessages}
          participantProfiles={participants.map((p) => ({
            participantId: p.id,
            displayName: p.name,
            avatarUrl: p.avatarUrl ? getSafeImageUrl(p.avatarUrl) || p.avatarUrl : null,
          }))}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          currentUserId={currentUserId}
          isGuest={isGuest}
          currentUserAvatarUrl={currentUserAvatarUrl}
          typingUsers={typingUsers}
          isOnline={chatReady}
          hostParticipantId={hostParticipantId}
          pinnedMessageId={pinnedMessage?.id}
          onTogglePinMessage={hostParticipantId ? handleTogglePinMessage : undefined}
          voiceStatus={voiceStatus}
          voiceError={voiceError}
          isMuted={isMuted}
          remoteParticipants={remoteParticipants}
          voiceStatuses={voiceStatuses}
          onStartVoice={startVoice}
          onStopVoice={stopVoice}
          onToggleMute={toggleMute}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      <GamePlayShell
        title={t(activeConfig.titleKey)}
        subtitle={t(activeConfig.subtitleKey)}
        gameType={activeConfig.type}
        eventId={eventId || ''}
        participants={participants}
        onEnd={() => requestActivityExitWithFeedback('end_clicked')}
        sidebar={chatSidebar}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatarUrl={currentUserAvatarUrl}
        onEditProfile={() => setShowProfileEdit(true)}
        organizationLogo={typeof (eventPublicObj as any)?.organization_logo === 'string' ? (eventPublicObj as any).organization_logo : undefined}
        organizationName={typeof (eventPublicObj as any)?.organization_name === 'string' ? (eventPublicObj as any).organization_name : undefined}
        hideBackButton={true}
        disconnectedBadgeCount={disconnectedBadgeCount}
        hideHeader
      >
        <GameBoardRouter
          config={activeConfig}
          eventId={eventId || ''}
          participants={participants}
          participantId={participantId || null}
          currentUserName={currentUserName}
          currentUserAvatarUrl={currentUserAvatarUrl}
          sessionId={sessionId}
          setSessionId={setSessionId}
          activeRoundId={activeRoundId}
          setActiveRoundId={setActiveRoundId}
          initialSnapshot={initialSnapshot}
          setInitialSnapshot={setInitialSnapshot}
          gameData={gameData}
          setGameData={setGameData}
          isGameAdmin={isGameAdmin}
          winsPosts={winsPosts}
          canPostWins={canPostWins}
          winsEndTimeIso={winsEndTimeIso}
          winsPostingClosed={winsPostingClosed}
          postParticipantId={postParticipantId}
          refetchPosts={refetchPosts}
          gamesSocket={gamesSocket}
          showError={showError}
          onRequestActivityExitWithFeedback={requestActivityExitWithFeedback}
        />
      </GamePlayShell>

      {/* In-game profile edit modal */}
      <AnimatePresence>
        {showProfileEdit && (
          <UserProfileSetup
            asModal
            defaultName={profile?.displayName || currentUserName}
            defaultAvatarUrl={profile?.avatarUrl}
            submitLabel={t('profile.save', { defaultValue: 'Save Profile' })}
            onSubmit={handleProfileSave}
            onClose={() => setShowProfileEdit(false)}
          />
        )}
      </AnimatePresence>

      <ActivityFeedbackModal
        open={showActivityFeedback}
        onOpenChange={setShowActivityFeedback}
        disabledReason={!participantId ? t('activityFeedback.modal.missingParticipant', { defaultValue: 'Unable to identify your participant. You can still skip.' }) : undefined}
        eventId={eventId || ''}
        participantId={participantId}
        gameSessionId={sessionId}
        gameTypeKey={activeConfig.gameTypeKey}
        source={activityFeedbackSource}
        onSubmitted={onFeedbackSubmitted}
      />
    </div>
  );
}

export default function GamePlay() {
  return (
    <ErrorBoundary>
      <GamePlayWithoutBoundary />
    </ErrorBoundary>
  );
}
