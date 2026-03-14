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
import { CountdownOverlay } from '@/features/app/components/game/shared';
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
import { eventsApi } from '@/features/app/api/events';

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
  const { isGuest, userId: currentUserId, displayName, avatarUrl } = identity;

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
  const [showCountdown, setShowCountdown] = useState(false);
  const [joinError, setJoinError] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const upsertProfile = useUpsertEventProfile(id || undefined);
  const { showError } = useApiError();

  /** Join logic — defined before effect that depends on it */
  const handleJoin = useCallback(async () => {
    if (!id || !profile) return;
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
        setJoinError(err?.message || t('events.joinFailed'));
      }
    } finally {
      setIsJoining(false);
    }
  }, [id, profile, isAuthenticated, user, inviteToken, acceptInvitation, joinEvent, joinAsGuest, guestEmail, t]);

  // ─── Auto-Join Logic ──────────────────────────────────────────────────────

  // 1. If returning user (already has a participant entry on server), set joined status immediately
  useEffect(() => {
    if (identity.participantId && !hasJoined) {
      console.log('[EventLobby] detected existing participant on server, marking hasJoined=true', {
        eventId: id,
        participantId: identity.participantId,
      });
      setHasJoined(true);
    }
  }, [identity.participantId, hasJoined]);

  // 2. Auto-trigger join when profile is ready and form is dismissed (first-time joiners)
  useEffect(() => {
    if (profile && !showProfileForm && !hasJoined && !isJoining && !joinError) {
      console.log('[EventLobby] auto-joining after profile ready', {
        eventId: id,
        hasJoined,
        isJoining,
        hasJoinError: !!joinError,
      });
      handleJoin();
    }
  }, [profile, showProfileForm, hasJoined, isJoining, joinError, handleJoin]);

  const joinLink = `${window.location.origin}/join/${id}`;
  const participants = (participantsData as any)?.data ?? [];
  const shouldShowYouPill =
    !!(hasJoined && profile) &&
    !(identity.participantId && participants.some((p: any) => p.id === identity.participantId));
  const hostParticipantId = participants.find((p: any) => p.is_host)?.id as string | undefined;
  const isHostSelf = !!(identity.participantId && participants.some((p: any) => p.id === identity.participantId && p.is_host));

  // Chat state: initial history from API + live messages from WebSocket
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
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

  const eventsSocket = useEventsSocket({
    eventId: id || undefined,
    // We handle the join logic explicitly via useEffect below to avoid race conditions.
    onError: (e) => showError(e, t('events.joinFailed')),
  });

  // Ensure socket connects when user successfully joins (especially guests who just got their token)
  useEffect(() => {
    if (hasJoined && !eventsSocket.isConnected && eventsSocket.status === 'disconnected') {
      console.log('[EventLobby] hasJoined=true, connecting events socket', { eventId: id });
      eventsSocket.connect();
    }
  }, [hasJoined, eventsSocket]);

  // Join the event room when connected AND officially joined
  useEffect(() => {
    if (hasJoined && id && eventsSocket.isConnected) {
      console.log('[EventLobby] events socket connected & hasJoined, emitting event:join', {
        eventId: id,
        socketConnected: eventsSocket.isConnected,
      });
      eventsSocket.emit('event:join', { eventId: id })
        .then((ack: any) => {
          console.log('[EventLobby] event:join ack', ack);
          if (ack?.data?.participantId) {
            if (isGuest) {
              localStorage.setItem(`guest_participant_id_${id}`, ack.data.participantId);
            } else {
              localStorage.setItem(`member_participant_id_${id}`, ack.data.participantId);
            }
          }
          eventsSocket.emit('event:presence', { eventId: id }).catch(() => {});
        })
        .catch((err: any) => {
           console.error('[EventLobby] Failed to join event room:', err?.message || err);
           showError(err, 'Failed to join event room');
        });
    }
  }, [hasJoined, id, eventsSocket.isConnected, eventsSocket, showError]);

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

    const unsubPresence = eventsSocket.on('event:presence', handlePresence);
    const unsubJoined = eventsSocket.on('event:user_joined', handleUserJoined);
    const unsubLeft = eventsSocket.on('event:user_left', handleUserLeft);

    return () => {
      unsubPresence?.();
      unsubJoined?.();
      unsubLeft?.();
    };
  }, [eventsSocket.isConnected, id, refetchParticipants, eventsSocket]);

  // Reconnect backfill: when socket transitions back to connected, refetch messages and participants
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

  // Live chat listeners in lobby
  useEffect(() => {
    if (!eventsSocket.isConnected || !id) return;

    const handleChatMessage = (data: any) => {
      console.log('[EventLobby] chat:message', data);
      const name = data.senderName || 'Player';
      const isOwn = isGuest
        ? data.participantId === identity.participantId
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

    const unsubMessage = eventsSocket.on('chat:message', handleChatMessage);
    const unsubTyping = eventsSocket.on('chat:typing', handleTyping);

    return () => {
      unsubMessage?.();
      unsubTyping?.();
    };
  }, [eventsSocket.isConnected, id, isGuest, identity.participantId, user?.id, currentUserId, eventsSocket]);

  // Leave event room when lobby unmounts
  useEffect(() => {
    return () => {
      if (id && eventsSocket.socket?.connected) {
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

  const handleCountdownComplete = useCallback(() => {
    const playPath = ROUTES.PLAY(id) + (gameParam ? `?game=${gameParam}` : '');
    navigate(playPath);
  }, [navigate, id, gameParam]);

  const handleSendMessage = useCallback((message: string) => {
    if (eventsSocket.isConnected && id) {
      eventsSocket.emit('chat:message', { eventId: id, message }).catch((err: any) => {
        console.error('[EventLobby] Failed to send message:', err?.message || err);
        showError(err, 'Failed to send message');
      });
    }
  }, [eventsSocket.isConnected, id, eventsSocket, showError]);

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
        <CountdownOverlay active={showCountdown} onComplete={handleCountdownComplete} />
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-2xl space-y-6">
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

              <div className="relative p-6 sm:p-8 space-y-6">
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
                      <img src={profile.avatarUrl} alt="You" className="h-10 w-10 rounded-xl object-cover shrink-0" />
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
                        {(event as any).participant_count} <span className="text-xs font-normal text-muted-foreground">joined</span>
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
                          <img src={profile.avatarUrl} alt="You" className="h-7 w-7 rounded-full object-cover" />
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
                  <EventChat
                    eventId={id || ''}
                    messages={allMessages}
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
                    <Button className="flex-1 h-12 gap-2 text-sm" onClick={() => setShowCountdown(true)}>
                      <ArrowRight className="h-4 w-4" /> {t('events.enterGame')}
                    </Button>
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
                  <img src={logoImg} alt="Flowkyn" className="h-5 w-5 object-contain opacity-50" />
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
