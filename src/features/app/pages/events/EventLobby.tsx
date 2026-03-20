/**
 * @fileoverview Event Lobby page — composed from UserProfileSetup + main lobby view.
 *
 * EVERYONE (guests AND authenticated users) must choose a nickname + avatar before joining.
 * The profile is stored per-event in localStorage.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import {
  Users, Clock, Gamepad2, ArrowRight, Copy, CheckCircle,
  Link2, Wifi, Sparkles, Shield, Loader2, AlertCircle, X, User,
} from 'lucide-react';
import { LogoLoader } from '@/components/loading/LogoLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/utils/clipboard';
import {
  useEventPublicInfo,
  useEventParticipants,
  useEventMessages,
  useJoinEvent,
  useJoinAsGuest,
  useAcceptEventInvitation,
} from '@/hooks/queries/useEventQueries';
import { hasEventToken } from '@/hooks/queries/useMyEventParticipant';
import { useUpsertEventProfile } from '@/hooks/queries/useEventProfile';
import { useEventIdentity } from '@/hooks/useEventIdentity';
import { useAuth } from '@/features/app/context/AuthContext';
import { UserProfileSetup, type ProfileSetupData } from '@/features/app/components/auth/UserProfileSetup';
import { EventChat, type ChatMessage } from '@/features/app/components/chat/EventChat';
import { useEventsSocket } from '@/hooks/useSocket';
import logoImg from '@/assets/logo.png';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { toast } from 'sonner';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useApiError } from '@/hooks/useApiError';
import { useParticipantProfileRealtimeSync } from '@/hooks/useParticipantProfileRealtimeSync';
import { eventsApi } from '@/features/app/api/events';
import { LanguageSelector } from '@/components/common';

// ─── Profile helpers ────────────────────────────────────────────────────────

/** Keys for per-event profile in localStorage */
const profileKey = (eventId: string) => `event_profile_${eventId}`;

function getStoredProfile(eventId: string): { displayName: string; avatarUrl: string } | null {
  try {
    const raw = localStorage.getItem(profileKey(eventId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.avatarUrl) data.avatarUrl = getSafeImageUrl(data.avatarUrl);
    return data;
  } catch { return null; }
}

function saveProfile(eventId: string, data: ProfileSetupData) {
  localStorage.setItem(profileKey(eventId), JSON.stringify(data));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventLobby() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const gameParam = searchParams.get('game');
  const { isAuthenticated, user } = useAuth();

  console.log('[EventLobby] mount', { eventId: id });

  const { data: event, isLoading: eventLoading } = useEventPublicInfo(id || '');
  const { data: participantsData, refetch: refetchParticipants } = useEventParticipants(id || '');
  const hasToken = hasEventToken(id || undefined);
  const { data: messagesData, refetch: refetchMessages } = useEventMessages(id || '', 1, 50, hasToken);
  const joinEvent = useJoinEvent();
  const joinAsGuest = useJoinAsGuest();
  const acceptInvitation = useAcceptEventInvitation();

  // Profile state — strictly rely on localStorage to test if the user explicitly clicked "Continue to Lobby" for this specific event device sessions.
  const identity = useEventIdentity(id || undefined);
  const { isGuest, userId: currentUserId, displayName, avatarUrl, isLoading: isIdentityLoading } = identity;

  // We use the server profile purely for pre-filling the UserProfileSetup form if they are authenticated,
  // we DO NOT use it to silently bypass the form anymore.
  const serverBackedProfile: ProfileSetupData | null = displayName
    ? { displayName, avatarUrl: avatarUrl || '' }
    : null;

  const storedProfile = id ? getStoredProfile(id) : null;
  console.log('[EventLobby] identity & storedProfile', { id, identity, storedProfile });

  const [profile, setProfile] = useState<ProfileSetupData | null>(storedProfile);
  const [showProfileForm, setShowProfileForm] = useState(!storedProfile);

  const [guestEmail, setGuestEmail] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  // Removed lobby countdown: navigation should be immediate; countdown belongs to game start.
  const [joinError, setJoinError] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const upsertProfile = useUpsertEventProfile(id || undefined);
  const { showError } = useApiError();

  const eventsSocket = useEventsSocket({
    eventId: id || undefined,
    onError: (e) => showError(e, t('events.joinFailed')),
  });

  // Refs for chat handler to avoid re-registering listener when identity loads (prevents missing real-time messages)
  const identityRef = useRef(identity);
  const userRef = useRef(user);
  identityRef.current = identity;
  userRef.current = user;

  /** Join logic — defined before effect that depends on it */
  const handleJoin = useCallback(async () => {
    if (!id || !profile || isJoining || hasJoined) return;
    console.log('[EventLobby] handleJoin start', {
      eventId: id,
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
          if (!/^[A-Za-z0-9_-]+$/.test(inviteToken)) {
            setJoinError(t('events.invalidInvitationToken'));
            return;
          }
          await acceptInvitation.mutateAsync({ eventId: id, token: inviteToken });
        } else {
          const result = await joinEvent.mutateAsync(id);
          if ((result as any)?.participant_id) {
            localStorage.setItem(`member_participant_id_${id}`, (result as any).participant_id);
          }
        }
        trackEvent(TRACK.EVENT_JOINED, { eventId: id, viaInvitation: !!inviteToken });
      } else {
        const safeAvatarUrl = profile.avatarUrl?.startsWith('http') ? profile.avatarUrl : undefined;
        const result = await joinAsGuest.mutateAsync({
          eventId: id,
          data: { name: profile.displayName, email: guestEmail || undefined, avatar_url: safeAvatarUrl, token: inviteToken || undefined },
        });
        if (result.guest_token) {
          localStorage.setItem(`guest_token_${id}`, result.guest_token);
          localStorage.setItem(`guest_participant_id_${id}`, result.participant_id);
          localStorage.setItem(`guest_name_${id}`, result.guest_name);
        }
        trackEvent(TRACK.EVENT_GUEST_JOINED, { eventId: id, guestName: profile.displayName });
      }
      console.log('[EventLobby] handleJoin success', { eventId: id, mode: isAuthenticated ? 'member' : 'guest' });
      setHasJoined(true);
    } catch (err: any) {
      if (err?.statusCode === 409 || err?.status === 409 || err?.code === 'ALREADY_PARTICIPANT') {
        console.warn('[EventLobby] handleJoin already participant (409)', { eventId: id, error: err });
        setHasJoined(true);
      } else {
        console.error('[EventLobby] handleJoin error', err);
        const code = err?.response?.data?.code || err?.code;
        if (code === 'EVENT_FULL') {
          setJoinError(t('events.errors.full', 'This event is full. Ask your host if they can increase the limit.'));
        } else if (code === 'NAME_TAKEN') {
          setJoinError(t('events.errors.nameTaken', 'This name is already taken in this lobby. Please choose a slightly different one.'));
        } else if (code === 'GUESTS_NOT_ALLOWED') {
          setJoinError(t('events.errors.guestsNotAllowed', 'This event is for members only. Please sign in or ask your host for access.'));
        } else if (code === 'NOT_A_MEMBER') {
          setJoinError(t('events.errors.notMember', "You’re not a member of this workspace for this event."));
        } else if (code === 'SESSION_NOT_ACTIVE') {
          setJoinError(t('events.errors.notActive', 'This event isn’t active yet — your host needs to start it.'));
        } else {
          setJoinError(err?.response?.data?.message || err?.message || t('events.joinFailed'));
        }
      }
    } finally {
      setIsJoining(false);
    }
  }, [id, profile, isAuthenticated, user, inviteToken, acceptInvitation, joinEvent, joinAsGuest, guestEmail, t]);

  // ─── Auto-Join Logic ──────────────────────────────────────────────────────

  // 1. If returning user (already has participant + completed profile before), set joined immediately.
  //    Do NOT set hasJoined from participantId alone — the creator is auto-joined on the backend
  //    but must still choose avatar/nickname. Only skip the profile form when they have storedProfile.
  useEffect(() => {
    if (identity.participantId && storedProfile && !hasJoined) {
      console.log('[EventLobby] detected returning participant with stored profile, marking hasJoined=true', {
        eventId: id,
        participantId: identity.participantId,
      });
      setHasJoined(true);
    }
  }, [identity.participantId, storedProfile, hasJoined]);

  // 2. Auto-trigger join when profile is ready and form is dismissed (first-time joiners)
  useEffect(() => {
    // Important: avoid calling `joinAsGuest` again on refresh.
    // If `identity.participantId` exists, the guest is already in the lobby and
    // `joinAsGuest` would try to recreate a new participant -> NAME_TAKEN.
    if (
      !isIdentityLoading &&
      profile &&
      !showProfileForm &&
      !hasJoined &&
      !identity.participantId &&
      !isJoining &&
      !joinError
    ) {
      console.log('[EventLobby] auto-joining after profile ready', {
        eventId: id,
        hasJoined,
        isJoining,
        hasJoinError: !!joinError,
      });
      handleJoin();
    }
  }, [profile, showProfileForm, hasJoined, isJoining, joinError, handleJoin, identity.participantId, isIdentityLoading, id]);

  const joinLink = `${window.location.origin}/join/${id}${gameParam ? `?game=${gameParam}` : ''}`;
  const participants = (participantsData as any)?.data ?? [];
  const shouldShowYouPill =
    !!(hasJoined && profile) &&
    !(identity.participantId && participants.some((p: any) => p.id === identity.participantId));
  const hostParticipantId = participants.find((p: any) => p.is_host)?.id as string | undefined;
  const isHostSelf = !!(identity.participantId && participants.some((p: any) => p.id === identity.participantId && p.is_host));

  useParticipantProfileRealtimeSync({
    eventId: id || undefined,
    participantId: identity.participantId || null,
    refetchParticipants,
    eventsSocket,
    setOwnProfile: setProfile,
    logPrefix: 'EventLobby',
  });

  // Chat state: initial history from API + live messages from WebSocket
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const lastChatSentAtRef = useRef<number | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);

  const rawMessages = (messagesData as any)?.data || [];
  const initialMessages: ChatMessage[] = rawMessages.map((m: any) => ({
    id: m.id,
    userId: m.user_id || m.participant_id,
    participantId: m.participant_id,
    senderName: m.user_name || m.guest_name || 'Unknown',
    senderAvatar: (m.user_name || m.guest_name || '??').slice(0, 2).toUpperCase(),
    senderAvatarUrl: getSafeImageUrl(m.avatar_url) || null,
    message: m.message,
    timestamp: m.created_at,
    isOwn: isGuest
      ? m.participant_id === identity.participantId
      : !!(m.user_id && m.user_id === user?.id),
  }));

  const seenIds = new Set<string>();
  const allMessages = [...(pinnedMessage ? [pinnedMessage] : []), ...initialMessages, ...liveMessages].filter(m => {
    if (seenIds.has(m.id)) return false;
    seenIds.add(m.id);
    return true;
  });

  const copyLinkTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const copyLink = async () => {
    const success = await copyToClipboard(joinLink);
    if (success) {
      console.log('[EventLobby] copy link success', { joinLink });
      trackEvent(TRACK.EVENT_LINK_COPIED, { eventId: id });
      setCopied(true);
      if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
      copyLinkTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t('common.copyFailed', 'Failed to copy link. Please manually copy the URL.'));
    }
  };

  useEffect(() => {
    return () => { if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current); };
  }, []);

  // Ensure socket connects when user successfully joins (especially guests who just got their token)
  useEffect(() => {
    if (hasJoined && !eventsSocket.isConnected && eventsSocket.status === 'disconnected') {
      console.log('[EventLobby] hasJoined=true, connecting events socket', { eventId: id });
      eventsSocket.connect();
    }
  }, [hasJoined, eventsSocket]);

  // Join the event room whenever the events socket is connected.
  // We intentionally do NOT gate this on hasJoined anymore:
  // - The backend verifyParticipant() will auto-insert organization members who haven't gone
  //   through the lobby join flow yet, so they can still participate in chat.
  // - This ensures that anyone who can successfully send chat messages is also in the room
  //   to receive real-time updates, instead of only seeing new messages after a reload.
  const eventsSocketRef = useRef(eventsSocket);
  eventsSocketRef.current = eventsSocket;
  useEffect(() => {
    if (!id || !eventsSocket.isConnected) return;
    const sock = eventsSocketRef.current;
    console.log('[EventLobby] events socket connected, emitting event:join', {
      eventId: id,
      socketConnected: sock.isConnected,
    });
    sock.emit('event:join', { eventId: id })
      .then((ack: any) => {
        console.log('[EventLobby] event:join ack', ack);
        if (ack?.data?.participantId) {
          if (identityRef.current.isGuest) {
            localStorage.setItem(`guest_participant_id_${id}`, ack.data.participantId);
          } else {
            localStorage.setItem(`member_participant_id_${id}`, ack.data.participantId);
          }
        }
        sock.emit('event:presence', { eventId: id }).catch(() => {});
      })
      .catch((err: any) => {
        console.error('[EventLobby] Failed to join event room:', err?.message || err);
        showError(err, t('events.errors.joinRoomFailed', { defaultValue: 'Failed to join event room' }));
      });
  }, [hasJoined, id, eventsSocket.isConnected, showError]);

  // Listen for presence updates and participant join/leave to keep lobby live
  useEffect(() => {
    if (!eventsSocket.isConnected || !id) return;

    const handlePresence = (payload: any) => {
      if (payload?.eventId !== id || !Array.isArray(payload.onlineUserIds)) return;
      console.log('[EventLobby] event:presence payload', payload);
      setOnlineCount(payload.onlineUserIds.length);
    };

    const handleUserJoined = () => {
      console.log('[EventLobby] event:user_joined');
      refetchParticipants();
      eventsSocket.emit('event:presence', { eventId: id }).catch(() => {});
    };

    const handleUserLeft = () => {
      console.log('[EventLobby] event:user_left');
      refetchParticipants();
      eventsSocket.emit('event:presence', { eventId: id }).catch(() => {});
    };

    // participant:joined/left come via event:notification (API join before socket); refetch immediately
    const handleNotification = (data: { type?: string }) => {
      if (data?.type === 'participant:joined' || data?.type === 'participant:left') {
        refetchParticipants();
      }
    };
    const unsubNotification = eventsSocket.on('event:notification', handleNotification);
    const unsubPresence = eventsSocket.on('event:presence', handlePresence);
    const unsubJoined = eventsSocket.on('event:user_joined', handleUserJoined);
    const unsubLeft = eventsSocket.on('event:user_left', handleUserLeft);

    return () => {
      unsubNotification?.();
      unsubPresence?.();
      unsubJoined?.();
      unsubLeft?.();
    };
  }, [eventsSocket.isConnected, id, refetchParticipants, eventsSocket]);

  // Reconnect backfill: when socket transitions back to connected, refetch messages and participants.
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (eventsSocket.status === 'connected') {
      if (!wasConnectedRef.current) {
        wasConnectedRef.current = true;
        if (id) {
          setIsSyncing(true);
          Promise.all([refetchParticipants(), refetchMessages()])
            .catch((err) => {
              console.error('[EventLobby] reconnect backfill error', err);
            })
            .finally(() => setIsSyncing(false));
        }
      }
    } else {
      wasConnectedRef.current = false;
    }
  }, [eventsSocket.status, id, refetchParticipants, refetchMessages]);

  // Fallback polling: keep messages and participants fresh even if socket events are missed
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      refetchMessages();
      refetchParticipants();
    }, 6000);

    return () => clearInterval(interval);
  }, [id, refetchMessages, refetchParticipants]);

  // Fetch pinned message once for lobby display
  useEffect(() => {
    if (!id) return;
    console.log('[EventLobby] fetching pinned message', { eventId: id });
    eventsApi.getPinnedMessage(id)
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
        console.warn('[EventLobby] getPinnedMessage failed (non-fatal)');
      });
  }, [id]);

  // Live chat listeners — use refs for identity so we don't re-register on identity load (prevents missing real-time messages)
  useEffect(() => {
    if (!eventsSocket.isConnected || !id) return;

    const handleChatMessage = (data: any) => {
      console.log('[EventLobby] Socket message received:', data);
      const idCurrent = identityRef.current;
      const usr = userRef.current;
      
      if (!idCurrent) {
        console.warn('[EventLobby] Received chat message but identity is not loaded. Defaulting to isOwn=false.');
      }

      const name = data.senderName || 'Player';
      const isOwn = idCurrent?.isGuest
        ? data.participantId === idCurrent.participantId
        : !!(data.userId && data.userId === usr?.id);

      const msg: ChatMessage = {
        id: data.id || `ws-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
        userId: data.userId,
        participantId: data.participantId,
        senderName: name,
        senderAvatar: name.slice(0, 2).toUpperCase(),
        senderAvatarUrl: getSafeImageUrl(data.senderAvatarUrl) || null,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        isOwn,
      };
      
      console.log('[EventLobby] Appending to liveMessages:', msg);
      setLiveMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleTyping = (data: { userId: string; userName?: string; isTyping: boolean }) => {
      const idCurrent = identityRef.current;
      const uid = idCurrent.userId || idCurrent.participantId;
      if (data.userId === uid || (idCurrent.isGuest && data.userId === `guest:${uid}`)) return;
      const displayId = data.userName || data.userId;
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(displayId)) return [...prev, displayId];
        if (!data.isTyping) return prev.filter(u => u !== displayId);
        return prev;
      });
    };

    const unsubMessage = eventsSocket.on('chat:message', handleChatMessage);
    const unsubTyping = eventsSocket.on('chat:typing', handleTyping);

    return () => {
      unsubMessage?.();
      unsubTyping?.();
    };
  }, [eventsSocket.isConnected, id, eventsSocket]);

  // Leave event room when lobby unmounts
  useEffect(() => {
    return () => {
      if (id && eventsSocket.socket?.connected) {
        console.log('[EventLobby] Leaving event room', id);
        eventsSocket.socket.emit('event:leave', { eventId: id });
      }
    };
  }, [id, eventsSocket.socket]);

  /** Called when user completes profile setup — join happens in useEffect; upsert only after join */
  const handleProfileComplete = (data: ProfileSetupData) => {
    if (!id) return;
    console.log('[EventLobby] profile complete', { eventId: id, data });
    saveProfile(id, data);
    setProfile(data);
    setShowProfileForm(false);
    if (hasJoined) upsertProfile.mutate({ display_name: data.displayName, avatar_url: data.avatarUrl || null });
  };

  // Persist profile to backend only AFTER join succeeds (upsert requires participant)
  const hasUpsertedProfileRef = useRef(false);
  useEffect(() => {
    if (hasJoined && profile && id && !hasUpsertedProfileRef.current) {
      hasUpsertedProfileRef.current = true;
      upsertProfile.mutate({ display_name: profile.displayName, avatar_url: profile.avatarUrl || null });
    }
    if (!hasJoined) hasUpsertedProfileRef.current = false;
  }, [hasJoined, profile, id, upsertProfile]);

  const jumpToGame = useCallback(() => {
    const playPath = ROUTES.PLAY(id) + (gameParam ? `?game=${gameParam}` : '');
    navigate(playPath);
  }, [navigate, id, gameParam]);

  const handleSendMessage = useCallback((message: string) => {
    if (!id) return;

    const now = Date.now();
    if (lastChatSentAtRef.current && now - lastChatSentAtRef.current < 1000) {
      console.warn('[EventLobby] Dropping chat send due to local rate limit');
      return;
    }
    lastChatSentAtRef.current = now;

    // Optimistically refresh HTTP messages after server acks the socket emit,
    // so users see their message even if they joined the room slightly late.
    if (eventsSocket.isConnected) {
      eventsSocket.emit('chat:message', { eventId: id, message })
        .then(() => {
          console.log('[EventLobby] chat:message ack received, refetching messages', { eventId: id });
          refetchMessages();
        })
        .catch((err: any) => {
          console.error('[EventLobby] Failed to send message:', err?.message || err);
          showError(err, t('chat.errors.sendFailed', { defaultValue: 'Failed to send message' }));
        });
    } else {
      console.warn('[EventLobby] Socket not connected, cannot send message — falling back to HTTP refetch');
      // Even if socket isn't connected, trigger a refetch so the UI can pick up messages
      refetchMessages();
    }
  }, [eventsSocket.isConnected, id, eventsSocket, refetchMessages, showError]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (eventsSocket.isConnected && id) {
      eventsSocket.emit('chat:typing', { eventId: id, isTyping }).catch(() => {});
    }
  }, [eventsSocket.isConnected, id, eventsSocket]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (eventLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LogoLoader size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t('events.notFound')}</p>
      </div>
    );
  }

  // ── Profile form gate — everyone must go through this ────────────────────
  if (showProfileForm && !hasJoined) {
    return (
      <ErrorBoundary>
        <UserProfileSetup
          title={t('events.setupGameProfile')}
          subtitle={t('events.chooseAppearIn', { eventTitle: event.title })}
          defaultName={serverBackedProfile?.displayName || (isAuthenticated && user ? user.name : '')}
          defaultAvatarUrl={serverBackedProfile?.avatarUrl || storedProfile?.avatarUrl}
          submitLabel={t('events.continueToLobby')}
          showEmail={!isAuthenticated}
          email={guestEmail}
          onEmailChange={setGuestEmail}
          onSubmit={handleProfileComplete}
        />
      </ErrorBoundary>
    );
  }

  // ── Main lobby ───────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <>
        {/* Countdown removed: show countdown only when game actually starts */}
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-2xl space-y-6">
            {/* Step chips */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px] border px-2 py-1", showProfileForm ? "bg-primary/5 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border/60")}>
                {t('events.steps.profile', '1. Set profile')}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] border px-2 py-1", !showProfileForm && !hasJoined ? "bg-primary/5 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border/60")}>
                {t('events.steps.join', '2. Join event')}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] border px-2 py-1", hasJoined ? "bg-primary/5 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border/60")}>
                {t('events.steps.play', '3. Enter game')}
              </Badge>
            </div>

            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

              {/* Language switcher (top-right) */}
              <div className="absolute top-4 right-4 z-20">
                <LanguageSelector align="end" />
              </div>

              <div className="relative p-6 sm:p-8 space-y-6">
                {/* Draft banner */}
                {event.status === 'draft' && (
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/40">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold text-foreground">
                        {t('events.lifecycle.draftBannerTitle', "Your facilitator hasn’t started yet")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t('events.lifecycle.draftBannerBody', 'You can still join the lobby, chat, and get ready while you wait.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {joinError && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-destructive">{joinError}</p>
                    </div>
                    <button onClick={() => setJoinError('')} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-4">
                  {event.organization_logo ? (
                    <div className="h-14 w-14 rounded-2xl border border-border bg-card flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-sm">
                      <img src={event.organization_logo} alt={event.organization_name} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                      <Gamepad2 className="h-7 w-7 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground">{event.title}</h1>
                      <Badge className={cn("text-[10px] gap-1 shrink-0",
                        event.event_mode === 'sync' ? 'bg-success/15 text-success border-success/25' : 'bg-info/15 text-info border-info/25')}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                        {event.event_mode === 'sync' ? t('events.badgeLive') : t('events.badgeAsync')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{event.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t('events.hostedBy')} <span className="font-medium text-foreground">{event.organization_name}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1.5">
                      {event.allow_guests ? t('events.guestsAllowed', 'Guests allowed') : t('events.membersOnly', 'Members only')}
                      {' · '}
                      {t('events.maxParticipantsShort', { count: event.max_participants })}
                      {' · '}
                      {t('events.statusLabel', 'Status')}: <span className="font-medium text-foreground">{event.status}</span>
                    </p>
                  </div>
                </div>

                {/* Your profile preview */}
                {profile && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={t('common.you', { defaultValue: 'You' })} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {profile.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{profile.displayName}</p>
                      <p className="text-[10px] text-muted-foreground">{t('events.yourGameProfile')}</p>
                    </div>
                    <button
                      onClick={() => setShowProfileForm(true)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 shrink-0"
                    >
                      <User className="h-3 w-3" /> {t('common.edit')}
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {(event as any).participant_count}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          {t('events.joined', { defaultValue: 'joined' })}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {(event as any).invited_count ? t('events.invitedCountFull', { count: (event as any).invited_count }) : t('events.maxParticipantsShort', { count: event.max_participants })}
                      </p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center"><Clock className="h-4 w-4 text-warning" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{event.status}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('common.status')}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><Wifi className="h-4 w-4 text-success" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {eventsSocket.status === 'connected' && (
                          <>
                            {t('events.connected')}
                            {onlineCount !== null && (
                              <span className="text-xs font-normal text-muted-foreground ml-1">
                                · {onlineCount} {t('events.online')}
                              </span>
                            )}
                            {isSyncing && (
                              <span className="text-[11px] font-medium text-muted-foreground ml-1">
                                · {t('events.syncing', 'Syncing…')}
                              </span>
                            )}
                          </>
                        )}
                        {eventsSocket.status === 'reconnecting' && (
                          <span className="text-xs font-medium text-warning">
                            {t('events.reconnecting', 'Reconnecting…')}
                          </span>
                        )}
                        {eventsSocket.status === 'disconnected' && !eventsSocket.isConnected && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {t('events.offline', 'Offline')}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('common.status')}</p>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('events.waitingToStart')}</h3>
                  {participants.length === 0 && (
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <p className="text-[12px] font-semibold text-foreground">
                        {t('events.emptyParticipants.title', "You’re the first one here")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t('events.emptyParticipants.body', 'Share the link below to invite your team, then come back here to start together.')}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {participants.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/50">
                        <Avatar className="h-7 w-7">
                          {p.avatar && <AvatarImage src={p.avatar} />}
                          <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">
                          {p.name}
                          {p.is_host && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                              ★ {t('events.host', 'Host')}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                    {shouldShowYouPill && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt={t('common.you', { defaultValue: 'You' })} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                            {profile.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground">{profile.displayName}</span>
                        <Badge className="text-[8px] h-4 px-1.5 bg-primary/15 text-primary border-primary/25">{t('events.you')}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-2">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="h-2 w-2 rounded-full bg-muted-foreground/20 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1">{t('events.waitingForOthers')}</span>
                    </div>
                  </div>
                </div>

                {/* Live chat in lobby */}
                <div className="pt-2">
                  {/* Guidance card */}
                  <div className="mb-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <p className="text-[12px] font-semibold text-foreground">
                      {t('events.guidance.nextTitle', 'What happens next')}
                    </p>
                    <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                      <li>
                        {t('events.guidance.step1', {
                          defaultValue: '1) Wait for everyone to join ({{count}} joined so far).',
                          count: participants.length,
                        })}
                      </li>
                      <li>{t('events.guidance.step2', '2) Your host will start the activity.')}</li>
                      <li>{t('events.guidance.step3', '3) You’ll automatically see the game when it starts.')}</li>
                    </ul>
                    {isHostSelf && (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {t('events.guidance.hostPinHint', 'Host tip: pin a message with key instructions so everyone sees it.')}
                      </p>
                    )}
                  </div>
                  <EventChat
                    eventId={id || ''}
                    messages={allMessages}
                    participantProfiles={participants.map((p: any) => ({
                      participantId: String(p.id),
                      displayName: typeof p.name === 'string' ? p.name : null,
                      avatarUrl: typeof p.avatar === 'string' ? (getSafeImageUrl(p.avatar) || p.avatar) : null,
                    }))}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    currentUserId={currentUserId}
                    isGuest={isGuest}
                    currentUserAvatarUrl={avatarUrl}
                    typingUsers={typingUsers}
                    isOnline={eventsSocket.status === 'connected'}
                    hostParticipantId={hostParticipantId}
                  />
                </div>

                {inviteToken && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/20">
                    <Shield className="h-4 w-4 text-success shrink-0" />
                    <p className="text-xs text-success">{t('events.validInvitation')}</p>
                  </div>
                )}

                {/* Share link */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={joinLink} readOnly className="h-8 text-[12px] bg-background/60 flex-1 border-border/50" />
                  <Button size="sm" variant="outline" onClick={copyLink} className="h-8 text-[11px] gap-1 shrink-0 rounded-lg">
                    {copied ? <CheckCircle className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t('events.copied') : t('events.copy')}
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {!hasJoined ? (
                    <Button
                      className="flex-1 h-12 gap-2 text-sm"
                      onClick={handleJoin}
                      disabled={isJoining || !profile}
                    >
                      {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isAuthenticated ? t('events.joinEvent') : t('events.guestJoin')}
                    </Button>
                  ) : (
                    <div className="flex-1 space-y-2">
                      {identity.participantId && profile && (
                        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                          {t('events.returning.welcomeBack', {
                            defaultValue: 'Welcome back, {{name}} — you can jump into the game.',
                            name: profile.displayName,
                          })}
                        </div>
                      )}
                      <Button className="w-full h-12 gap-2 text-sm" onClick={jumpToGame}>
                        <ArrowRight className="h-4 w-4" /> {t('events.returning.jumpIntoGame', t('events.enterGame'))}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground p-4">
              {event.organization_logo ? (
                <>
                  <span className="text-label-xs">{t('events.poweredBy')}</span>
                  <img src={event.organization_logo} alt={event.organization_name} className="h-5 w-auto max-w-[100px] object-contain grayscale opacity-60" />
                </>
              ) : (
                <>
                  <img src={logoImg} alt={t('brand.name', { defaultValue: 'Flowkyn' })} className="h-5 w-5 object-contain opacity-50" />
                  <span className="text-label-xs">{t('events.poweredBy')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
}
