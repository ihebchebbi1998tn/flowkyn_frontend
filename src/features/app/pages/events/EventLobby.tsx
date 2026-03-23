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
import { LogoLoader } from '@/components/loading/LogoLoader';
import { ROUTES } from '@/constants/routes';
import { copyToClipboard } from '@/utils/clipboard';
import {
  useEventPublicInfo,
  useEventParticipants,
  useJoinEvent,
  useJoinAsGuest,
  useAcceptEventInvitation,
} from '@/hooks/queries/useEventQueries';
import { hasEventToken } from '@/hooks/queries/useMyEventParticipant';
import { useUpsertEventProfile } from '@/hooks/queries/useEventProfile';
import { useEventIdentity } from '@/hooks/useEventIdentity';
import { useAuth } from '@/features/app/context/AuthContext';
import { UserProfileSetup, type ProfileSetupData } from '@/features/app/components/auth/UserProfileSetup';
import { useEventsSocket } from '@/hooks/useSocket';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { toast } from 'sonner';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useApiError } from '@/hooks/useApiError';
import { useParticipantProfileRealtimeSync } from '@/hooks/useParticipantProfileRealtimeSync';
import { setGuestToken, getOrCreateGuestIdentityKey } from '@/lib/guestTokenPersistence';
import { getStoredEventProfile, saveEventProfile } from '@/lib/eventProfileStorage';
import { useEventLobbyJoin } from '@/hooks/useEventLobbyJoin';
import { useEventLobbyPresence } from '@/hooks/useEventLobbyPresence';
import { EventLobbyCard } from './components/EventLobbyCard';

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventLobby() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const gameParam = searchParams.get('game');
  const { isAuthenticated, user } = useAuth();


  const { data: event, isLoading: eventLoading } = useEventPublicInfo(id || '');
  const { data: participantsData, refetch: refetchParticipants } = useEventParticipants(id || '');
  const hasToken = hasEventToken(id || undefined);
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

  const rawStored = id ? getStoredEventProfile(id) : null;
  const storedProfile = rawStored
    ? { ...rawStored, avatarUrl: getSafeImageUrl(rawStored.avatarUrl) || rawStored.avatarUrl }
    : null;

  const [profile, setProfile] = useState<ProfileSetupData | null>(storedProfile);
  const [showProfileForm, setShowProfileForm] = useState(!storedProfile);

  const [guestEmail, setGuestEmail] = useState('');
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const { hasJoined, setHasJoined, isJoining, joinError, setJoinError, handleJoin } = useEventLobbyJoin({
    eventId: id || null,
    profile,
    storedProfile,
    showProfileForm,
    isIdentityLoading,
    participantId: identity.participantId || null,
      isAuthenticated,
    user: user || null,
    inviteToken,
    guestEmail,
    joinEvent,
    joinAsGuest,
    acceptInvitation,
    getOrCreateGuestIdentityKey,
    setGuestToken,
    t,
    onJoinSuccess: ({ eventId: eid, viaInvitation, guestName: gname }) => {
      trackEvent(TRACK.EVENT_JOINED, { eventId: eid, viaInvitation });
      if (gname) trackEvent(TRACK.EVENT_GUEST_JOINED, { eventId: eid, guestName: gname });
    },
  });

  useEventLobbyPresence({
    eventId: id || null,
        hasJoined,
    isGuest,
    eventsSocket,
    identityRef,
    refetchParticipants,
    setOnlineCount,
    setIsSyncing,
    showError,
    tJoinRoomFailed: t('events.errors.joinRoomFailed', { defaultValue: 'Failed to join event room' }),
  });

  const joinLink = `${window.location.origin}/join/${id}?game=${gameParam || '1'}`;
  const participants = (participantsData as any)?.data ?? [];
  const shouldShowYouPill =
    !!(hasJoined && profile) &&
    !(identity.participantId && participants.some((p: any) => p.id === identity.participantId));

  useParticipantProfileRealtimeSync({
    eventId: id || undefined,
    participantId: identity.participantId || null,
    refetchParticipants,
    eventsSocket,
    setOwnProfile: setProfile,
    logPrefix: 'EventLobby',
  });

  const copyLinkTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const copyLink = async () => {
    const success = await copyToClipboard(joinLink);
    if (success) {
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

  /** Called when user completes profile setup — join happens in useEffect; upsert only after join */
  const handleProfileComplete = (data: ProfileSetupData) => {
    if (!id) return;
    saveEventProfile(id, data);
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
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
        <EventLobbyCard
          event={event as any}
          showProfileForm={showProfileForm}
          hasJoined={hasJoined}
          profile={profile}
          joinError={joinError}
          onClearJoinError={() => setJoinError('')}
          onEditProfile={() => setShowProfileForm(true)}
          participants={participants}
          shouldShowYouPill={shouldShowYouPill}
          inviteToken={inviteToken}
          joinLink={joinLink}
          copied={copied}
          onCopyLink={copyLink}
          isJoining={isJoining}
          isAuthenticated={isAuthenticated}
          onJoin={handleJoin}
          onJumpToGame={jumpToGame}
          eventsSocketStatus={eventsSocket.status}
          eventsSocketConnected={eventsSocket.isConnected}
          onlineCount={onlineCount}
          isSyncing={isSyncing}
          participantId={identity.participantId || null}
          t={t}
                  />
                </div>
    </ErrorBoundary>
  );
}
