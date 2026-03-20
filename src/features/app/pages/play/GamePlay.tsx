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
import { ROUTES } from '@/constants/routes';
import { useEventPublicInfo, useEventParticipants, useEventMessages, useEventPosts, useJoinEvent, useJoinAsGuest, useAcceptEventInvitation } from '@/hooks/queries/useEventQueries';
import { useEventIdentity } from '@/hooks/useEventIdentity';
import { hasEventToken } from '@/hooks/queries/useMyEventParticipant';
import { useUpsertEventProfile } from '@/hooks/queries/useEventProfile';
import { useParticipantProfileRealtimeSync } from '@/hooks/useParticipantProfileRealtimeSync';
import { useGameChatState } from '@/hooks/useGameChatState';
import { useGameStateSync } from '@/hooks/useGameStateSync';
import { useParticipantPresenceSync } from '@/hooks/useParticipantPresenceSync';
import { useEventsSocket, useGamesSocket } from '@/hooks/useSocket';
import { useAuth } from '@/features/app/context/AuthContext';
import { useApiError } from '@/hooks/useApiError';
import { eventsApi } from '@/features/app/api/events';
import { gamesApi } from '@/features/app/api/games';
import { GameBoardRouter } from './GameBoardRouter';
import { GAME_CONFIGS } from './gameTypes';
import { useSetGameHeader } from '@/features/app/layouts/gameHeaderContext';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function getDataArray(v: unknown): unknown[] {
  if (isRecord(v) && Array.isArray(v.data)) return v.data as unknown[];
  return [];
}

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

// GAME_CONFIGS and GAME_TYPES live in ./gameTypes to keep this file smaller.

function GamePlayWithoutBoundary() {
  const { id: eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showError } = useApiError();
  const setGameHeader = useSetGameHeader();

  const gameTypeId = searchParams.get('game') || '1';
  const urlConfig = GAME_CONFIGS[gameTypeId] || GAME_CONFIGS['1'];

  // ─── Current user identity (server-driven) ─────────────────────────────────
  const identity = useEventIdentity(eventId || undefined);
  const { isGuest, userId: currentUserId, participantId, displayName, avatarUrl, isLoading: isIdentityLoading } = identity;

  // We start with the URL param config, but will update it if the server tells us a different game is active.
  const [activeConfig, setActiveConfig] = useState(urlConfig);

  console.log('[GamePlay] mount', { eventId, identity, gameTypeId, activeConfig });

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

  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  
  const joinEvent = useJoinEvent();
  const joinAsGuest = useJoinAsGuest();
  const acceptInvitation = useAcceptEventInvitation();
  const upsertProfile = useUpsertEventProfile(eventId || undefined);
  const inviteToken = searchParams.get('token');
  const { isAuthenticated } = useAuth();

  const identityRef = useRef(identity);
  const userRef = useRef(user);
  useEffect(() => {
    identityRef.current = identity;
    userRef.current = user;
  }, [identity, user]);

  const currentUserName = profile?.displayName || displayName;
  const currentUserAvatarUrl = profile?.avatarUrl || avatarUrl;

  const handleProfileSave = useCallback((data: ProfileSetupData) => {
    if (!eventId) return;
    console.log('[GamePlay] profile save', { eventId, data });
    saveProfile(eventId, data);
    setProfile(data);
    upsertProfile.mutate({ display_name: data.displayName, avatar_url: data.avatarUrl || null });
    setShowProfileEdit(false);
  }, [eventId, upsertProfile]);

  /** Join logic — ensures tokens are obtained and rooms joined */
  const handleJoin = useCallback(async () => {
    if (!eventId || !profile || isJoining || hasJoined) return;
    console.log('[GamePlay] handleJoin start', {
      eventId,
      isAuthenticated,
      isGuest,
      hasInviteToken: !!inviteToken,
      profile,
    });
    setJoinError('');
    setIsJoining(true);
    try {
      if (isAuthenticated && user) {
        if (inviteToken) {
          await acceptInvitation.mutateAsync({ eventId, token: inviteToken });
        } else {
          const result = await joinEvent.mutateAsync(eventId);
          const pid = isRecord(result) ? result.participant_id : null;
          if (typeof pid === 'string') {
            localStorage.setItem(`member_participant_id_${eventId}`, pid);
          }
        }
      } else {
        const safeAvatarUrl = profile.avatarUrl?.startsWith('http') ? profile.avatarUrl : undefined;
        const result = await joinAsGuest.mutateAsync({
          eventId,
          data: {
            name: profile.displayName,
            email: guestEmail || undefined,
            avatar_url: safeAvatarUrl,
            token: inviteToken || undefined,
          },
        });
        if (result.guest_token) {
          localStorage.setItem(`guest_token_${eventId}`, result.guest_token);
          localStorage.setItem(`guest_participant_id_${eventId}`, result.participant_id);
          localStorage.setItem(`guest_name_${eventId}`, result.guest_name);
        }
      }
      console.log('[GamePlay] handleJoin success', { eventId, mode: isAuthenticated ? 'member' : 'guest' });
      setHasJoined(true);
    } catch (err: unknown) {
      if ((err as any)?.status === 409 || (err as any)?.response?.status === 409) {
        console.warn('[GamePlay] handleJoin already participant (409)', { eventId, error: err });
        setHasJoined(true);
      } else {
        console.error('[GamePlay] handleJoin error', err);
        setJoinError((err as any)?.message || t('event.joinFailed', { defaultValue: 'Failed to join event' }));
      }
    } finally {
      setIsJoining(false);
    }
  }, [eventId, profile, isAuthenticated, user, inviteToken, acceptInvitation, joinEvent, joinAsGuest, guestEmail]);

  // 1. If we already have a participant identity from server, we are "joined"
  useEffect(() => {
    if (participantId && !hasJoined) {
      console.log('[GamePlay] detected existing participant on server, marking hasJoined=true', {
        eventId,
        participantId,
      });
      setHasJoined(true);
    }
  }, [participantId, hasJoined]);

  // 2. Auto-join after profile is confirmed
  useEffect(() => {
    if (isIdentityLoading) return; // Wait for server to confirm whether we already have a participant account
    if (profile && !showProfileEdit && !hasJoined && !isJoining) {
      console.log('[GamePlay] auto-joining after profile ready', {
        eventId,
        hasJoined,
        isJoining,
      });
      handleJoin();
    }
  }, [profile, showProfileEdit, hasJoined, isJoining, handleJoin, isIdentityLoading]);

  // ─── Real data from API ────────────────────────────────────────────────────
  const { data: eventData } = useEventPublicInfo(eventId || '');
  const { data: participantsData, refetch: refetchParticipants } = useEventParticipants(eventId || '');
  const canFetchParticipantData = hasEventToken(eventId || undefined) && (!!participantId || hasJoined);
  const { data: messagesData, refetch: refetchMessages } = useEventMessages(eventId || '', 1, 50, canFetchParticipantData);
  const { data: postsData, refetch: refetchPosts } = useEventPosts(eventId || '', 1, 50, canFetchParticipantData);

  const eventPublicObj: Record<string, unknown> | null = isRecord(eventData) ? (eventData as Record<string, unknown>) : null;
  console.log('[GamePlay] data load', {
    eventId,
    canFetchParticipantData,
    hasMessagesData: !!messagesData,
    hasPostsData: !!postsData,
    hasParticipantsData: !!participantsData,
  });

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

  // ─── WebSocket: Events namespace (chat) ────────────────────────────────────
  const eventsSocket = useEventsSocket({
    // Pass eventId so the socket hook can resolve the correct per-event guest token
    eventId: eventId || undefined,
    onError: (e) => showError(e, t('chat.errors.generic', { defaultValue: 'Chat error' })),
  });

  const gamesSocket = useGamesSocket({
    // Use eventId so guests can authenticate with their per-event guest token
    eventId: eventId || undefined,
    onError: (e) => {
      const msg = (e as any)?.message;
      showError(e, msg || t('gamePlay.errors.socket', { defaultValue: 'Game connection error' }));
    },
  });

  // 3. Ensure socket connects when joined
  useEffect(() => {
    if (hasJoined && !eventsSocket.isConnected && eventsSocket.status === 'disconnected') {
      eventsSocket.connect();
    }
  }, [hasJoined, eventsSocket]);

  // Ensure games socket also connects when joined (for game states)
  useEffect(() => {
    if (hasJoined && !gamesSocket.isConnected && gamesSocket.status === 'disconnected') {
      gamesSocket.connect();
    }
  }, [hasJoined, gamesSocket]);

  // ─── WebSocket room management (ensure we are in the rooms) ────────────────
  const joinEventRoom = useCallback(() => {
    if (eventsSocket.isConnected && eventId) {
      console.log('[GamePlay] Emitting event:join for', eventId);
      eventsSocket.emit('event:join', { eventId })
        .then((ack: any) => {
          console.log('[GamePlay] event:join ack:', ack);
          if (ack?.data?.participantId) {
            if (isGuest) {
              localStorage.setItem(`guest_participant_id_${eventId}`, ack.data.participantId);
            } else {
              localStorage.setItem(`member_participant_id_${eventId}`, ack.data.participantId);
            }
          }
        })
        .catch(err => {
          console.error('[GamePlay] Failed to join event room:', err?.message || err);
          showError(err, t('events.errors.joinRoomFailed', { defaultValue: 'Failed to join event room' }));
        });
    }
  }, [eventsSocket.isConnected, eventId, isGuest, showError]);

  // Initial joins
  useEffect(() => {
    if (eventsSocket.isConnected && eventId) joinEventRoom();
  }, [eventsSocket.isConnected, eventId, joinEventRoom]);

  // Re-join on socket reconnection + refetch messages that may have been missed
  useEffect(() => {
    if (!eventsSocket.socket) return;
    const onConnect = () => {
      console.log('[GamePlay] Events socket reconnected, re-joining room + refetching messages...');
      joinEventRoom();
      // Refetch HTTP messages to recover any missed during the disconnection window
      refetchMessages();
    };
    eventsSocket.socket.on('connect', onConnect);
    return () => { eventsSocket.socket?.off('connect', onConnect); };
  }, [eventsSocket.socket, joinEventRoom, refetchMessages]);

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
          if (session.game_key) {
            import('./gameTypes').then(({ GAME_KEY_TO_CONFIG_ID, GAME_CONFIGS }) => {
              if (!cancelled) {
                const correctConfigId = GAME_KEY_TO_CONFIG_ID[session.game_key as keyof typeof GAME_KEY_TO_CONFIG_ID];
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
    }, 5000);
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

  // Fallback polling: when events socket is offline, periodically refetch messages
  // so in-game chat still updates without requiring a full page reload.
  useEffect(() => {
    if (!eventId) return;
    if (eventsSocket.status === 'connected') return;

    const interval = setInterval(() => {
      if (eventsSocket.status !== 'connected') {
        console.log('[GamePlay] Polling messages because events socket is not connected', {
          eventId,
          socketStatus: eventsSocket.status,
        });
        refetchMessages();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId, eventsSocket.status, refetchMessages]);

  // Participants polling: fallback so Coffee Roulette and other games see new joins
  // even if event:user_joined/participant:joined are missed (e.g. late socket connect)
  useEffect(() => {
    if (!eventId || !hasJoined) return;
    const interval = setInterval(() => {
      refetchParticipants();
    }, 6000);
    return () => clearInterval(interval);
  }, [eventId, hasJoined, refetchParticipants]);

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
        } else {
          // Fallback: resolve latest active session from API
          gamesApi.getActiveSession(eventId).then((s: any) => setSessionId(s ? s.id : null)).catch(() => {});
        }
      }
    };

    const unsub = eventsSocket.on('event:notification', handleEventNotification);
    return unsub;
  }, [eventsSocket.isConnected, eventId, refetchParticipants, refetchPosts]);

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
      onEnd: () => navigate(ROUTES.EVENTS),
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
    setGameHeader,
    (eventPublicObj as any)?.organization_logo,
    (eventPublicObj as any)?.organization_name,
    (eventPublicObj as any)?.event_mode,
    (eventPublicObj as any)?.title,
    (eventPublicObj as any)?.description,
    disconnectedBadgeCount,
    t,
  ]);

  useGameStateSync({
    gamesSocket,
    sessionId,
    hasJoined,
    participantId,
    setActiveRoundId,
    setInitialSnapshot,
    setGameData,
    setIsGameAdmin,
  });

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

    if (eventsSocket.isConnected && eventId) {
      console.log('[GamePlay] Sending message to eventId:', eventId, 'message:', message);
      eventsSocket.emit('chat:message', { eventId, message })
        .then(() => {
          console.log('[GamePlay] chat:message ack received, refetching messages', { eventId });
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
  }, [eventsSocket.isConnected, eventId, showError, refetchMessages]);

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
    <div className="space-y-3 sticky top-20 max-h-[calc(100vh-96px)] flex flex-col">
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
      <div className="flex-1 min-h-[260px]">
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
          isOnline={eventsSocket.status === 'connected'}
          hostParticipantId={hostParticipantId}
          pinnedMessageId={pinnedMessage?.id}
          onTogglePinMessage={hostParticipantId ? handleTogglePinMessage : undefined}
        />
      </div>
    </div>
  );

  return (
    <>
      <GamePlayShell
        title={t(activeConfig.titleKey)}
        subtitle={t(activeConfig.subtitleKey)}
        gameType={activeConfig.type}
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
