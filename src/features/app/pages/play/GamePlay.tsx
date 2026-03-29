import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SocketReconnectionBanner } from '@/components/game/SocketReconnectionBanner';
import { GamePlayShell } from '@/features/app/components/game/shell';
import type { GameParticipant } from '@/features/app/components/game/shell';
import { EventChat } from '@/features/app/components/chat/EventChat';
import { UserProfileSetup, type ProfileSetupData } from '@/features/app/components/auth/UserProfileSetup';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { getStoredEventProfile, saveEventProfile } from '@/lib/eventProfileStorage';
import { useGamePlayJoin } from '@/hooks/useGamePlayJoin';
import { ROUTES } from '@/constants/routes';
import { useEventPublicInfo, useEventParticipants, useEventMessages, useEventPosts, useJoinEvent, useJoinAsGuest, useAcceptEventInvitation } from '@/hooks/queries/useEventQueries';
import { useEventIdentity } from '@/hooks/useEventIdentity';
import { hasEventToken } from '@/hooks/queries/useMyEventParticipant';
import { getOrCreateGuestIdentityKey } from '@/lib/guestTokenPersistence';
import { setGuestToken } from '@/lib/guestTokenPersistence';
import { useUpsertEventProfile } from '@/hooks/queries/useEventProfile';
import { useParticipantProfileRealtimeSync } from '@/hooks/useParticipantProfileRealtimeSync';
import { useGameChatState } from '@/hooks/useGameChatState';
import { useParticipantPresenceSync } from '@/hooks/useParticipantPresenceSync';
import { useEventVoiceChat } from '@/hooks/useEventVoiceChat';
import { useAuth } from '@/features/app/context/AuthContext';
import { useApiError } from '@/hooks/useApiError';
import { GameBoardRouter } from './GameBoardRouter';
import { GAME_CONFIGS, GAME_KEY_TO_CONFIG_ID } from './gameTypes';
import { useSetGameHeader } from '@/features/app/layouts/gameHeaderContext';
import { ActivityFeedbackModal } from '@/features/app/components/game/shared/ActivityFeedbackModal';
import type { ActivityFeedbackSource } from '@/features/app/api/activityFeedbacks';
import { useGameSession, useGameSockets, useGameChat, useWinsPosts } from './hooks';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function getDataArray(v: unknown): unknown[] {
  if (isRecord(v) && Array.isArray(v.data)) return v.data as unknown[];
  return [];
}

function GamePlayWithoutBoundary() {
  const { id: eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { showError } = useApiError();
  const setGameHeader = useSetGameHeader();

  const rawGameParam = searchParams.get('activity') || '1';
  const gameTypeId = GAME_CONFIGS[rawGameParam]
    ? rawGameParam
    : (GAME_KEY_TO_CONFIG_ID[rawGameParam as keyof typeof GAME_KEY_TO_CONFIG_ID] ?? '1');
  const urlConfig = GAME_CONFIGS[gameTypeId] ?? GAME_CONFIGS['1'];

  // ─── Identity ──────────────────────────────────────────────────────────────
  const identity = useEventIdentity(eventId || undefined);
  const { isGuest, userId: currentUserId, participantId, displayName, avatarUrl, isLoading: isIdentityLoading } = identity;

  const guestParticipantId = isGuest ? participantId : null;
  const memberParticipantId = !isGuest ? participantId : null;

  // ─── Profile ───────────────────────────────────────────────────────────────
  const storedProfile = eventId ? getStoredEventProfile(eventId) : null;
  const initialProfile: ProfileSetupData | null = storedProfile
    ? { displayName: storedProfile.displayName || displayName || 'Guest', avatarUrl: storedProfile.avatarUrl || avatarUrl || '' }
    : displayName
      ? { displayName, avatarUrl: avatarUrl || '' }
      : null;

  const [profile, setProfile] = useState<ProfileSetupData | null>(initialProfile);
  const [showProfileEdit, setShowProfileEdit] = useState(() => !initialProfile);
  const [showActivityFeedback, setShowActivityFeedback] = useState(false);
  const [activityFeedbackSource, setActivityFeedbackSource] = useState<ActivityFeedbackSource>('end_clicked');
  const [guestEmail, setGuestEmail] = useState('');

  const joinEvent = useJoinEvent();
  const joinAsGuest = useJoinAsGuest();
  const acceptInvitation = useAcceptEventInvitation();
  const upsertProfile = useUpsertEventProfile(eventId || undefined);
  const inviteToken = searchParams.get('token');

  const { hasJoined, setHasJoined, isJoining, joinError, handleJoin } = useGamePlayJoin({
    eventId: eventId || null, profile, participantId: participantId || null,
    isIdentityLoading, showProfileEdit, isAuthenticated, user: user || null, inviteToken,
    guestEmail, joinEvent, joinAsGuest, acceptInvitation, getOrCreateGuestIdentityKey, setGuestToken,
    tJoinFailed: t('event.joinFailed', { defaultValue: 'Failed to join event' }),
  });

  const identityRef = useRef(identity);
  const userRef = useRef(user);
  useEffect(() => { identityRef.current = identity; userRef.current = user; }, [identity, user]);

  const currentUserName = profile?.displayName || displayName;
  const currentUserAvatarUrl = profile?.avatarUrl || avatarUrl;

  useEffect(() => {
    if (joinError) { setShowProfileEdit(true); showError(new Error(joinError), joinError); }
  }, [joinError, showError]);

  const handleProfileSave = useCallback(async (data: ProfileSetupData) => {
    if (!eventId) return;
    await upsertProfile.mutateAsync({ display_name: data.displayName, avatar_url: data.avatarUrl || null });
    saveEventProfile(eventId, data);
    setProfile(data);
  }, [eventId, upsertProfile]);

  const requestActivityExitWithFeedback = useCallback((source: ActivityFeedbackSource) => {
    setActivityFeedbackSource(source); setShowActivityFeedback(true);
  }, []);

  const sessionIdRef = useRef<string | null>(null);
  const gamesSocketRef = useRef<typeof gamesSocket | null>(null);

  const onFeedbackSubmitted = useCallback(() => {
    // Tell the backend to end the game session before navigating away
    const sid = sessionIdRef.current;
    const gs = gamesSocketRef.current;
    if (sid && gs?.isConnected) {
      try {
        gs.emit('game:end', { sessionId: sid });
      } catch (err) {
        console.warn('[GamePlay] Failed to emit game:end on feedback skip', err);
      }
    }
    if (!eventId) return navigate(ROUTES.EVENTS);
    navigate(`${ROUTES.EVENT_LOBBY(eventId)}?activity=${gameTypeId}`);
  }, [navigate, eventId, gameTypeId]);

  // Auto-upsert profile from localStorage after reload
  const autoUpsertKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!eventId || isIdentityLoading || !hasJoined || !profile) return;
    const storedKey = `${profile.displayName}::${profile.avatarUrl || ''}`;
    if (autoUpsertKeyRef.current === storedKey) return;
    const needsUpsert = (displayName || '').trim() !== profile.displayName.trim() ||
      (avatarUrl || '').trim() !== (profile.avatarUrl || '').trim();
    if (!needsUpsert) return;
    autoUpsertKeyRef.current = storedKey;
    void upsertProfile.mutateAsync({ display_name: profile.displayName, avatar_url: profile.avatarUrl || null })
      .catch(() => { autoUpsertKeyRef.current = null; });
  }, [eventId, isIdentityLoading, hasJoined, profile, displayName, avatarUrl, upsertProfile]);

  // ─── API data ──────────────────────────────────────────────────────────────
  const { data: eventData } = useEventPublicInfo(eventId || '');
  const { data: participantsData, refetch: refetchParticipants } = useEventParticipants(eventId || '');
  const canFetchParticipantData = hasEventToken(eventId || undefined) && (!!participantId || hasJoined);
  const { data: messagesData, refetch: refetchMessages } = useEventMessages(eventId || '', 1, 50, canFetchParticipantData);
  const { data: postsData, refetch: refetchPosts } = useEventPosts(eventId || '', 1, 50, canFetchParticipantData);

  const eventPublicObj: Record<string, unknown> | null = isRecord(eventData) ? (eventData as Record<string, unknown>) : null;

  // Map API participants to GameParticipant shape (memoized to prevent infinite re-renders)
  const rawParticipants = getDataArray(participantsData);
  const participants: GameParticipant[] = useMemo(() => {
    const seen = new Set<string>();
    return rawParticipants
      .filter((p) => {
        if (!isRecord(p) || typeof p.id !== 'string') return false;
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .map((p) => {
        const rec = p as Record<string, unknown>;
        const av = typeof rec.avatarUrl === 'string' ? rec.avatarUrl
          : typeof rec.avatar_url === 'string' ? rec.avatar_url
          : typeof rec.avatar === 'string' ? rec.avatar
          : typeof rec.user_avatar === 'string' ? rec.user_avatar
          : typeof rec.custom_avatar_url === 'string' ? rec.custom_avatar_url
          : typeof rec.guest_avatar === 'string' ? rec.guest_avatar
          : null;
        const name = typeof rec.name === 'string' && rec.name ? rec.name : 'Unknown';
        return {
          avatarUrl: av as string | null,
          id: String(rec.id),
          name,
          email: typeof rec.email === 'string' ? rec.email : null,
          avatar: name.slice(0, 2).toUpperCase(),
          status: 'joined' as const,
          joinedAt: typeof rec.joined_at === 'string' ? rec.joined_at : null,
          score: 0,
          isHost: !!rec.is_host,
        };
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantsData]);

  // ─── Sockets ───────────────────────────────────────────────────────────────
  const { eventsSocket, gamesSocket, chatReady, chatSocketError } = useGameSockets({
    eventId, isGuest, isIdentityLoading, hasJoined, participantId: participantId || null,
    showError, refetchMessages, refetchParticipants, refetchPosts,
    tJoinRoomFailed: t('events.errors.joinRoomFailed', { defaultValue: 'Failed to join event room' }),
    tChatError: t('chat.errors.generic', { defaultValue: 'Chat error' }),
    tGameError: t('gamePlay.errors.socket', { defaultValue: 'Game connection error' }),
  });

  // ─── Chat state (messages, pinned) ─────────────────────────────────────────
  const { allMessages, initialMessages, liveMessages, pinnedMessage, setPinnedMessage } = useGameChatState({
    eventId: eventId || undefined, messagesData, isGuest, guestParticipantId,
    userId: user?.id, tUnknown: t('common.unknown', { defaultValue: 'Unknown' }),
    eventsSocket, identityRef, userRef,
  });

  // ─── Voice chat ────────────────────────────────────────────────────────────
  const { status: voiceStatus, error: voiceError, isMuted, remoteParticipants, voiceStatuses, startVoice, stopVoice, toggleMute } = useEventVoiceChat({
    eventId: eventId || '', myParticipantId: participantId || '', eventsSocket,
  });

  // ─── Game session ──────────────────────────────────────────────────────────
  const {
    sessionId, setSessionId, sessionStartedAt, activeRoundId, setActiveRoundId,
    initialSnapshot, setInitialSnapshot, gameData, setGameData,
    activeConfig, gamesReady,
  } = useGameSession({
    eventId, hasJoined, participantId: participantId || null,
    gamesSocket, eventsSocket, urlConfig, showError, refetchParticipants, refetchPosts,
  });

  // Keep refs in sync for onFeedbackSubmitted callback
  useEffect(() => { sessionIdRef.current = sessionId ?? null; }, [sessionId]);
  useEffect(() => { gamesSocketRef.current = gamesSocket; }, [gamesSocket]);

  const { winsPosts, canPostWins, winsEndTimeIso, winsPostingClosed, postParticipantId } = useWinsPosts({
    postsData, eventPublicObj, guestParticipantId, memberParticipantId,
  });

  // ─── Chat actions ──────────────────────────────────────────────────────────
  const { typingUsers, handleSendMessage, handleTyping, handleTogglePinMessage } = useGameChat({
    eventId, chatReady, eventsSocket, currentUserId, isGuest, refetchMessages, showError,
    initialMessages, liveMessages, pinnedMessage, setPinnedMessage,
  });

  // ─── Realtime sync ─────────────────────────────────────────────────────────
  useParticipantProfileRealtimeSync({
    eventId: eventId || undefined, participantId, refetchParticipants,
    eventsSocket, gamesSocket, setOwnProfile: setProfile, logPrefix: 'GamePlay',
  });

  const { disconnectedBadgeCount } = useParticipantPresenceSync({
    eventId: eventId || undefined, sessionId, eventsSocket, gamesSocket, refetchParticipants,
  });

  // ─── Game header ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return;
    // Issue 8 fix: guard activeConfig access — it should always be defined but be defensive
    const eventTitle = eventPublicObj && typeof eventPublicObj.title === 'string' ? eventPublicObj.title as string : t(activeConfig?.titleKey ?? 'gamePlay.twoTruthsTitle');
    const eventSubtitle = eventPublicObj && typeof eventPublicObj.description === 'string' ? eventPublicObj.description as string : t(activeConfig?.subtitleKey ?? 'gamePlay.twoTruthsSubtitle');
    const lobbyModeRaw = eventPublicObj && typeof eventPublicObj.event_mode === 'string' ? String(eventPublicObj.event_mode) : null;
    const lobbyGameType: 'sync' | 'async' = lobbyModeRaw === 'sync' ? 'sync' : 'async';
    setGameHeader({
      title: eventTitle, subtitle: eventSubtitle, gameType: lobbyGameType, eventId, participants,
      onEnd: () => requestActivityExitWithFeedback('end_clicked'),
      currentUserName, currentUserAvatarUrl,
      onEditProfile: () => setShowProfileEdit(true),
      organizationLogo: eventPublicObj?.organization_logo as string | undefined,
      organizationName: eventPublicObj?.organization_name as string | undefined,
      disconnectedBadgeCount, hideBackButton: true,
      sessionStartedAt,
    });
    return () => setGameHeader(null);
  }, [eventId, activeConfig?.titleKey, activeConfig?.subtitleKey, participants, currentUserName, currentUserAvatarUrl,
    requestActivityExitWithFeedback, setGameHeader, eventPublicObj?.organization_logo, eventPublicObj?.organization_name,
    eventPublicObj?.event_mode, eventPublicObj?.title, eventPublicObj?.description, disconnectedBadgeCount, sessionStartedAt, t]);

  const hostParticipantId = participants.find(p => p.isHost)?.id;

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
          <button type="button" onClick={() => eventsSocket.connect()} className="text-label-xs text-primary hover:underline">
            {t('chat.retry', 'Retry')}
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <EventChat
          eventId={eventId || ''} messages={allMessages}
          participantProfiles={participants.map((p) => ({
            participantId: p.id, displayName: p.name,
            avatarUrl: p.avatarUrl ? getSafeImageUrl(p.avatarUrl) || p.avatarUrl : null,
          }))}
          onSendMessage={handleSendMessage} onTyping={handleTyping}
          currentUserId={currentUserId} isGuest={isGuest} currentUserAvatarUrl={currentUserAvatarUrl}
          typingUsers={typingUsers} isOnline={chatReady} hostParticipantId={hostParticipantId}
          pinnedMessageId={pinnedMessage?.id}
          onTogglePinMessage={hostParticipantId ? handleTogglePinMessage : undefined}
          voiceStatus={voiceStatus} voiceError={voiceError} isMuted={isMuted}
          remoteParticipants={remoteParticipants} voiceStatuses={voiceStatuses}
          onStartVoice={startVoice} onStopVoice={stopVoice} onToggleMute={toggleMute}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full min-h-0 flex flex-col">
      <GamePlayShell
        title={t(activeConfig?.titleKey ?? 'gamePlay.twoTruthsTitle')} subtitle={t(activeConfig?.subtitleKey ?? 'gamePlay.twoTruthsSubtitle')}
        gameType={activeConfig?.type ?? 'sync'} eventId={eventId || ''} participants={participants}
        onEnd={() => requestActivityExitWithFeedback('end_clicked')} sidebar={chatSidebar}
        currentUserId={currentUserId} currentUserName={currentUserName} currentUserAvatarUrl={currentUserAvatarUrl}
        onEditProfile={() => setShowProfileEdit(true)}
        organizationLogo={typeof eventPublicObj?.organization_logo === 'string' ? eventPublicObj.organization_logo as string : undefined}
        organizationName={typeof eventPublicObj?.organization_name === 'string' ? eventPublicObj.organization_name as string : undefined}
        hideBackButton disconnectedBadgeCount={disconnectedBadgeCount} hideHeader
      >
        <SocketReconnectionBanner status={gamesSocket.status} onReconnect={() => gamesSocket.connect()} className="mb-2" />
        <GameBoardRouter
          config={activeConfig} eventId={eventId || ''} participants={participants}
          participantId={participantId || null} currentUserName={currentUserName}
          currentUserAvatarUrl={currentUserAvatarUrl} sessionId={sessionId} setSessionId={setSessionId}
          activeRoundId={activeRoundId} setActiveRoundId={setActiveRoundId}
          initialSnapshot={initialSnapshot} setInitialSnapshot={setInitialSnapshot}
          gameData={gameData} setGameData={setGameData} winsPosts={winsPosts}
          canPostWins={canPostWins} winsEndTimeIso={winsEndTimeIso}
          winsPostingClosed={winsPostingClosed} postParticipantId={postParticipantId}
          refetchPosts={refetchPosts} gamesSocket={gamesSocket} eventsSocket={eventsSocket}
          showError={showError} onRequestActivityExitWithFeedback={requestActivityExitWithFeedback}
        />
      </GamePlayShell>

      <AnimatePresence>
        {showProfileEdit && (
          <UserProfileSetup asModal defaultName={profile?.displayName || currentUserName}
            defaultAvatarUrl={profile?.avatarUrl}
            submitLabel={t('profile.save', { defaultValue: 'Save Profile' })}
            onSubmit={handleProfileSave} onClose={() => setShowProfileEdit(false)}
          />
        )}
      </AnimatePresence>

      <ActivityFeedbackModal
        open={showActivityFeedback} onOpenChange={setShowActivityFeedback}
        disabledReason={!participantId ? t('activityFeedback.modal.missingParticipant', { defaultValue: 'Unable to identify your participant. You can still skip.' }) : undefined}
        eventId={eventId || ''} participantId={participantId} gameSessionId={sessionId}
        gameTypeKey={activeConfig.gameTypeKey} source={activityFeedbackSource}
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
