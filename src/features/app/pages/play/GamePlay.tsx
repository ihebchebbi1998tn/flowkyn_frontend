import { useState, useCallback, useEffect, useRef } from 'react';
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
  const config = GAME_CONFIGS[gameTypeId] || GAME_CONFIGS['1'];

  // ─── Current user identity (server-driven) ─────────────────────────────────
  const identity = useEventIdentity(eventId || undefined);
  const { isGuest, userId: currentUserId, participantId, displayName, avatarUrl } = identity;
  console.log('[GamePlay] mount', { eventId, identity, gameTypeId, config });

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
    if (!eventId || !profile) return;
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
          if ((result as any)?.participant_id) {
            localStorage.setItem(`member_participant_id_${eventId}`, (result as any).participant_id);
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
    } catch (err: any) {
      if (err?.status === 409 || err?.response?.status === 409) {
        console.warn('[GamePlay] handleJoin already participant (409)', { eventId, error: err });
        setHasJoined(true);
      } else {
        console.error('[GamePlay] handleJoin error', err);
        setJoinError(err?.message || 'Failed to join event');
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
    if (profile && !showProfileEdit && !hasJoined && !isJoining) {
      console.log('[GamePlay] auto-joining after profile ready', {
        eventId,
        hasJoined,
        isJoining,
      });
      handleJoin();
    }
  }, [profile, showProfileEdit, hasJoined, isJoining, handleJoin]);

  // ─── Real data from API ────────────────────────────────────────────────────
  const { data: eventData } = useEventPublicInfo(eventId || '');
  const { data: participantsData, refetch: refetchParticipants } = useEventParticipants(eventId || '');
  const canFetchParticipantData = hasEventToken(eventId || undefined) && (!!participantId || hasJoined);
  const { data: messagesData, refetch: refetchMessages } = useEventMessages(eventId || '', 1, 50, canFetchParticipantData);
  const { data: postsData, refetch: refetchPosts } = useEventPosts(eventId || '', 1, 50, canFetchParticipantData);

  const eventPublicObj = eventData as any;
  console.log('[GamePlay] data load', {
    eventId,
    canFetchParticipantData,
    hasMessagesData: !!messagesData,
    hasPostsData: !!postsData,
    hasParticipantsData: !!participantsData,
  });

  // Map API participants to GameParticipant shape (dedupe by id to avoid any duplicates)
  const rawParticipants = (participantsData as any)?.data || [];
  const seenParticipantIds = new Set<string>();
  const participants: GameParticipant[] = rawParticipants
    .filter((p: any) => {
      if (!p?.id || seenParticipantIds.has(p.id)) return false;
      seenParticipantIds.add(p.id);
      return true;
    })
    .map((p: any) => ({
    id: p.id,
    name: p.name || 'Unknown',
    email: p.email || null,
    avatar: (p.name || '??').slice(0, 2).toUpperCase(),
    avatarUrl: p.avatar || null,
    status: 'joined' as const,
    joinedAt: p.joined_at || null,
    score: 0,
    isHost: !!p.is_host,
  }));

  // ─── Chat messages (persistent API load + live WebSocket) ─────────────────
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);

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

  // Merge pinned (if any) + initial (from API) + live (from WebSocket) — deduplicate by id
  const allMessages = [...(pinnedMessage ? [pinnedMessage] : []), ...initialMessages, ...liveMessages].filter((m, i, self) => 
    i === self.findIndex((t) => t.id === m.id)
  );

  // ─── Game session state (moved up for use in callbacks) ────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isResolvingSession, setIsResolvingSession] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<any>(null);
  const [gameData, setGameData] = useState<any>(null);

  // ─── WebSocket: Events namespace (chat) ────────────────────────────────────
  const eventsSocket = useEventsSocket({
    // Pass eventId so the socket hook can resolve the correct per-event guest token
    eventId: eventId || undefined,
    onError: (e) => showError(e, 'Chat error'),
  });

  const gamesSocket = useGamesSocket({
    // Use eventId so guests can authenticate with their per-event guest token
    eventId: eventId || undefined,
    onError: (e) => showError(e, 'Game connection error'),
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
          showError(err, 'Failed to join event room');
        });
    }
  }, [eventsSocket.isConnected, eventId, isGuest, showError]);

  const joinGameRoom = useCallback(() => {
    if (gamesSocket.isConnected && sessionId) {
      console.log('[GamePlay] Emitting game:join for', sessionId);
      gamesSocket.emit<any>('game:join', { sessionId })
        .then((resp: any) => {
          const data = resp?.data || resp;
          console.log('[GamePlay] game:join resp:', data);
          if (data?.activeRoundId) setActiveRoundId(data.activeRoundId);
          if (data?.snapshot) {
            setInitialSnapshot(data.snapshot);
            setGameData(data.snapshot);
          }
        })
        .catch((err: any) => {
          console.error('[GamePlay] Failed to join game room:', err?.message || err);
          showError(err, 'Failed to join game room');
        });
    }
  }, [gamesSocket.isConnected, sessionId, showError]);

  // Initial joins
  useEffect(() => {
    if (eventsSocket.isConnected && eventId) joinEventRoom();
  }, [eventsSocket.isConnected, eventId, joinEventRoom]);

  useEffect(() => {
    if (gamesSocket.isConnected && sessionId) joinGameRoom();
  }, [gamesSocket.isConnected, sessionId, joinGameRoom]);

  // Re-join on socket reconnection
  useEffect(() => {
    if (!eventsSocket.socket) return;
    const onConnect = () => {
      console.log('[GamePlay] Events socket reconnected, re-joining room...');
      joinEventRoom();
    };
    eventsSocket.socket.on('connect', onConnect);
    return () => { eventsSocket.socket?.off('connect', onConnect); };
  }, [eventsSocket.socket, joinEventRoom]);

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
      
      console.log('[GamePlay] Appending to liveMessages:', msg);
      setLiveMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const unsub = eventsSocket.on('chat:message', handleChatMessage);
    return unsub;
  }, [eventsSocket.isConnected, eventId]);

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
  const canPostWins = !!postParticipantId;

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



  // Re-join the session robustly when connected
  useEffect(() => {
    if (gamesSocket.isConnected && sessionId) {
      gamesSocket.emit<any>('game:join', { sessionId })
        .then((resp: any) => {
          const data = resp?.data || resp;
          if (data?.activeRoundId) setActiveRoundId(data.activeRoundId);
          if (data?.snapshot) {
            setInitialSnapshot(data.snapshot);
            setGameData(data.snapshot);
          }
        })
        .catch((err: any) => {
          console.error('[GamePlay] Failed to join game room:', err?.message || err);
          showError(err, 'Failed to join game room');
        });
    }
  }, [gamesSocket.isConnected, sessionId, gamesSocket, showError]);

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
        showError(err, 'Failed to join game session');
      });
  }, [sessionId, gamesSocket.isConnected, showError]);

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
    };

    const unsub = eventsSocket.on('event:notification', handleEventNotification);
    return unsub;
  }, [eventsSocket.isConnected, eventId, refetchPosts]);

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
        .catch(err => {
          console.error('[GamePlay] Failed to send message:', err.message);
          showError(err, 'Failed to send message');
        });
    } else {
      console.warn('[GamePlay] Socket not connected, cannot send message — will retry when reconnected.');
    }
  }, [eventsSocket.isConnected, eventId, showError]);

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
      showError(err, 'Failed to update pinned message');
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
        <GameBoardRouter
          config={config}
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
          winsPosts={winsPosts}
          canPostWins={canPostWins}
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
