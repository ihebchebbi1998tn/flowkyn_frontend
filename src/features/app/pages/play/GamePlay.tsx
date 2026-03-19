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
import { useEventsSocket, useGamesSocket } from '@/hooks/useSocket';
import { useAuth } from '@/features/app/context/AuthContext';
import { useApiError } from '@/hooks/useApiError';
import { eventsApi } from '@/features/app/api/events';
import { gamesApi } from '@/features/app/api/games';
import { GameBoardRouter } from './GameBoardRouter';
import { GAME_CONFIGS } from './gameTypes';

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
      id: String((p as any).id),
      name: typeof (p as any).name === 'string' && (p as any).name ? (p as any).name : t('common.unknown', { defaultValue: 'Unknown' }),
      email: typeof (p as any).email === 'string' ? (p as any).email : null,
      avatar: (typeof (p as any).name === 'string' && (p as any).name ? (p as any).name : '??').slice(0, 2).toUpperCase(),
      avatarUrl: typeof (p as any).avatar === 'string' ? (p as any).avatar : null,
      status: 'joined' as const,
      joinedAt: typeof (p as any).joined_at === 'string' ? (p as any).joined_at : null,
      score: 0,
      isHost: !!(p as any).is_host,
    }));

  // ─── Chat messages (persistent API load + live WebSocket) ─────────────────
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [disconnectedBadgeCount, setDisconnectedBadgeCount] = useState(0);
  const disconnectedBadgeTimerRef = useRef<number | null>(null);

  const rawMessages = getDataArray(messagesData);
  const initialMessages: ChatMessage[] = rawMessages
    .filter((m) => isRecord(m) && typeof m.id === 'string' && typeof m.message === 'string')
    .map((m) => ({
    id: String((m as any).id),
    // For authenticated users: server stores user_id (real user ID). For guests: no user_id.
    userId: (m as any).user_id || (m as any).participant_id,
    participantId: (m as any).participant_id,
    senderName: (m as any).user_name || (m as any).guest_name || t('common.unknown', { defaultValue: 'Unknown' }),
    senderAvatar: String((m as any).user_name || (m as any).guest_name || '??').slice(0, 2).toUpperCase(),
    senderAvatarUrl: (m as any).avatar_url || null,
    message: String((m as any).message),
    timestamp: String((m as any).created_at),
    // isOwn: compare against user.id for auth users, guest participant ID for guests
    isOwn: isGuest
      ? (m as any).participant_id === guestParticipantId
      : !!((m as any).user_id && (m as any).user_id === user?.id),
  }));

  // Merge pinned (if any) + initial (from API) + live (from WebSocket) — deduplicate by id
  const allMessages = [...(pinnedMessage ? [pinnedMessage] : []), ...initialMessages, ...liveMessages].filter((m, i, self) => 
    i === self.findIndex((t) => t.id === m.id)
  );

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

  const joinGameRoom = useCallback(() => {
    // Avoid joining too early before participant identity is hydrated.
    if (!participantId && !hasJoined) return;
    if (gamesSocket.isConnected && sessionId) {
      console.log('[GamePlay] Emitting game:join for', sessionId);
      gamesSocket.emit<any>('game:join', { sessionId })
        .then((resp: any) => {
          const data = resp?.data || resp;
          console.log('[GamePlay] game:join resp:', data);
          if (data?.activeRoundId) setActiveRoundId(data.activeRoundId);
          setIsGameAdmin(!!data?.isAdmin);
          if (data?.snapshot) {
            setInitialSnapshot(data.snapshot);
            setGameData(data.snapshot);
          }
        })
        .catch((err: any) => {
          // Transient during startup/reconnect; retry logic elsewhere will recover.
          console.warn('[GamePlay] Failed to join game room (transient):', err?.message || err);
        });
    }
  }, [gamesSocket.isConnected, hasJoined, participantId, sessionId]);

  // Initial joins
  useEffect(() => {
    if (eventsSocket.isConnected && eventId) joinEventRoom();
  }, [eventsSocket.isConnected, eventId, joinEventRoom]);

  useEffect(() => {
    if (gamesSocket.isConnected && sessionId) joinGameRoom();
  }, [gamesSocket.isConnected, sessionId, joinGameRoom]);

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

  useEffect(() => {
    if (!gamesSocket.socket) return;
    const onConnect = () => {
      console.log('[GamePlay] Games socket reconnected, re-joining room...');
      joinGameRoom();
      if (sessionId) gamesSocket.emit('game:state_sync', { sessionId }).catch(() => {});
    };
    gamesSocket.socket.on('connect', onConnect);
    return () => { gamesSocket.socket?.off('connect', onConnect); };
  }, [gamesSocket.socket, sessionId, joinGameRoom]);

  // Listen for incoming chat messages
  const liveMessagesRef = useRef(liveMessages);
  liveMessagesRef.current = liveMessages;

  const makeWsId = useCallback(() => {
    return `ws-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
  }, []);

  useEffect(() => {
    if (!eventsSocket.isConnected) {
      console.log('[GamePlay] Chat listener: socket not connected');
      return;
    }

    console.log('[GamePlay] Setting up chat message listener for eventId:', eventId);

    const handleChatMessage = (data: any) => {
      console.log('[GamePlay] Socket message received:', data);
      const idCurrent = identityRef.current;
      const usr = userRef.current;
      
      const name = data.senderName || 'Player';
      const isOwn = idCurrent?.isGuest
        ? data.participantId === idCurrent.participantId
        : !!(data.userId && data.userId === usr?.id);
        
      const msg: ChatMessage = {
        id: data.id || makeWsId(),
        userId: data.userId,
        participantId: data.participantId,
        senderName: name,
        senderAvatar: name.slice(0, 2).toUpperCase(),
        senderAvatarUrl: getSafeImageUrl(data.senderAvatarUrl) || null,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        isOwn,
      };
      
      console.log('[GamePlay] Appending to liveMessages:', msg);
      setLiveMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const unsub = eventsSocket.on('chat:message', handleChatMessage);
    return unsub;
  }, [eventsSocket.isConnected, eventId, eventsSocket, makeWsId]);

  // Fetch pinned message for in-game chat once the eventId is known
  useEffect(() => {
    if (!eventId) return;
    eventsApi.getPinnedMessage(eventId)
      .then((row: any) => {
        if (!row) {
          setPinnedMessage(null);
          return;
        }
        const name = row.user_name || 'Player';
        setPinnedMessage({
          id: row.id,
          userId: row.user_id || row.participant_id,
          participantId: row.participant_id,
          senderName: name,
          senderAvatar: (name || '??').slice(0, 2).toUpperCase(),
          senderAvatarUrl: getSafeImageUrl(row.avatar_url) || null,
          message: row.message,
          timestamp: row.created_at,
          isOwn: false,
        });
      })
      .catch(() => {
        // Non-fatal; ignore errors here to avoid breaking game play
      });
  }, [eventId]);

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



  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const resolveSession = async () => {
      setIsResolvingSession(true);
      try {
        // Fetch the currently active session regardless of type (omit the specific gameTypeKey parameter).
        // This ensures that if a user follows a generic join link, they are instantly routed to the active game.
        const session = await gamesApi.getActiveSession(eventId);
        if (!cancelled) {
          setSessionId(session ? session.id : null);
          if (session && session.game_key) {
            import('./gameTypes').then(({ GAME_KEY_TO_CONFIG_ID, GAME_CONFIGS }) => {
              const correctConfigId = GAME_KEY_TO_CONFIG_ID[session.game_key as keyof typeof GAME_KEY_TO_CONFIG_ID];
              if (correctConfigId && GAME_CONFIGS[correctConfigId]) {
                setActiveConfig(GAME_CONFIGS[correctConfigId]);
              }
            });
          }
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
  }, [eventId]);



  // Listen for game snapshots pushed by server
  useEffect(() => {
    if (!gamesSocket.isConnected) return;
    const unsubState = gamesSocket.on('game:state', (payload: any) => {
      const snap = payload?.state?.snapshot;
      const ar = payload?.state?.activeRoundId;
      console.log('[GamePlay] Received game:state event:', { hasSnapshot: !!snap, hasActiveRound: !!ar });
      if (ar) setActiveRoundId(ar);
      if (snap) {
        console.log('[GamePlay] Updating game state from game:state event:', snap.kind);
        setInitialSnapshot(snap);
        setGameData(snap);
      }
    });
    const unsubData = gamesSocket.on('game:data', (payload: any) => {
      if (payload?.gameData) {
        console.log('[GamePlay] Received game:data event:', payload.gameData.kind);
        setGameData(payload.gameData);
      }
    });

    // Handle game lifecycle events emitted by host actions
    const unsubStarted = gamesSocket.on('game:started', () => {
      console.log('[GamePlay] Received game:started event, syncing state...');
      if (sessionId) {
        gamesSocket.emit('game:state_sync', { sessionId })
          .catch((err: any) => {
            console.error('[GamePlay] game:state_sync failed on game:started:', err?.message || err);
          });
      }
    });
    const unsubRoundStarted = gamesSocket.on('game:round_started', (payload: any) => {
      console.log('[GamePlay] Received game:round_started event');
      if (payload?.roundId) setActiveRoundId(payload.roundId);
      if (sessionId) {
        gamesSocket.emit('game:state_sync', { sessionId })
          .catch((err: any) => {
            console.error('[GamePlay] game:state_sync failed on game:round_started:', err?.message || err);
          });
      }
    });
    const unsubRoundEnded = gamesSocket.on('game:round_ended', () => {
      console.log('[GamePlay] Received game:round_ended event, syncing state...');
      if (sessionId) {
        gamesSocket.emit('game:state_sync', { sessionId })
          .catch((err: any) => {
            console.error('[GamePlay] game:state_sync failed on game:round_ended:', err?.message || err);
          });
      }
    });
    const unsubEnded = gamesSocket.on('game:ended', () => {
      console.log('[GamePlay] Received game:ended event, syncing state...');
      if (sessionId) {
        gamesSocket.emit('game:state_sync', { sessionId })
          .catch((err: any) => {
            console.error('[GamePlay] game:state_sync failed on game:ended:', err?.message || err);
          });
      }
    });

    return () => { 
      unsubState?.(); 
      unsubData?.(); 
      unsubStarted?.();
      unsubRoundStarted?.();
      unsubRoundEnded?.();
      unsubEnded?.();
    };
  }, [gamesSocket.isConnected, sessionId, gamesSocket]);

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

  // Listen for async post updates (Wins of the Week) via event notifications
  useEffect(() => {
    if (!eventsSocket.isConnected || !eventId) return;

    const handleEventNotification = (data: { type: string; payload: any }) => {
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
  }, [eventsSocket.isConnected, eventId, refetchPosts]);

  // Real-time participant sync (Event level & Game level)
  useEffect(() => {
    if (!eventsSocket.isConnected || !eventId) return;
    const triggerRefetch = () => {
      console.log('[GamePlay] Participant joined/left event, refetching...');
      refetchParticipants();
    };
    const unsubJoin = eventsSocket.on('event:user_joined', triggerRefetch);
    const unsubLeave = eventsSocket.on('event:user_left', triggerRefetch);
    return () => { unsubJoin?.(); unsubLeave?.(); };
  }, [eventsSocket.isConnected, eventId, refetchParticipants]);

  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;
    const triggerRefetchOnJoin = () => {
      console.log('[GamePlay] Player joined game, refetching participants...');
      refetchParticipants();
    };

    const triggerRefetchOnLeave = () => {
      console.log('[GamePlay] Player left game, refetching participants...');
      refetchParticipants();

      // Show a temporary "user disconnected" badge in the game shell.
      setDisconnectedBadgeCount((prev) => prev + 1);
      if (disconnectedBadgeTimerRef.current) {
        window.clearTimeout(disconnectedBadgeTimerRef.current);
      }
      disconnectedBadgeTimerRef.current = window.setTimeout(() => {
        setDisconnectedBadgeCount(0);
      }, 9000);
    };

    const unsubJoin = gamesSocket.on('game:player_joined', triggerRefetchOnJoin);
    const unsubLeave = gamesSocket.on('game:player_left', triggerRefetchOnLeave);
    return () => { unsubJoin?.(); unsubLeave?.(); };
  }, [gamesSocket.isConnected, sessionId, refetchParticipants]);

  useEffect(() => {
    return () => {
      if (disconnectedBadgeTimerRef.current) {
        window.clearTimeout(disconnectedBadgeTimerRef.current);
      }
    };
  }, []);

  // If we learn about a session while connected, proactively join its game room.
  // IMPORTANT: this must retry briefly because `game:join` can race with identity
  // hydration (participant not yet resolvable on first attempt), which would cause
  // users to miss subsequent real-time game:data updates until a full reload.
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

        // Sync snapshot immediately on successful room join.
        if (data?.snapshot) {
          setInitialSnapshot(data.snapshot);
          setGameData(data.snapshot);
        }
        if (data?.activeRoundId) {
          setActiveRoundId(data.activeRoundId);
        }

        await gamesSocket.emit('game:state_sync', { sessionId }).catch(() => {});
        console.log('[GamePlay] game:join succeeded', { sessionId, attempt });
      } catch (err: any) {
        console.warn('[GamePlay] game:join failed, will retry if attempts remain', {
          sessionId,
          attempt,
          error: err?.message || err,
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
    gamesSocket.isConnected,
    gamesSocket,
    hasJoined,
    participantId,
    sessionId,
    setActiveRoundId,
    setGameData,
    setInitialSnapshot,
  ]);

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
