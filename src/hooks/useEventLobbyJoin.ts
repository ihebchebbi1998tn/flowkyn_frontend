/**
 * Join lifecycle for EventLobby: handleJoin, auto-join, hasJoined state.
 */
import { useState, useCallback, useEffect } from 'react';

type ProfileSetupData = { displayName: string; avatarUrl: string };

type Options = {
  eventId: string | null;
  profile: ProfileSetupData | null;
  storedProfile: ProfileSetupData | null;
  showProfileForm: boolean;
  isIdentityLoading: boolean;
  participantId: string | null;
  isAuthenticated: boolean;
  user: { id: string } | null;
  inviteToken: string | null;
  guestEmail: string;
  joinEvent: { mutateAsync: (eventId: string) => Promise<unknown> };
  joinAsGuest: {
    mutateAsync: (opts: {
      eventId: string;
      data: { name: string; email?: string; avatar_url?: string; token?: string; guest_identity_key: string };
    }) => Promise<{ guest_token?: string; participant_id: string; guest_name?: string }>;
  };
  acceptInvitation: { mutateAsync: (opts: { eventId: string; token: string }) => Promise<unknown> };
  getOrCreateGuestIdentityKey: (eventId: string) => string;
  setGuestToken: (eventId: string, token: string) => void;
  t: (key: string, fallback?: string) => string;
  onJoinSuccess?: (opts: { eventId: string; viaInvitation: boolean; guestName?: string }) => void;
};

export function useEventLobbyJoin({
  eventId,
  profile,
  storedProfile,
  showProfileForm,
  isIdentityLoading,
  participantId,
  isAuthenticated,
  user,
  inviteToken,
  guestEmail,
  joinEvent,
  joinAsGuest,
  acceptInvitation,
  getOrCreateGuestIdentityKey,
  setGuestToken,
  t,
  onJoinSuccess,
}: Options) {
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleJoin = useCallback(async () => {
    if (!eventId || !profile || isJoining || hasJoined) return;
    setJoinError('');
    setIsJoining(true);
    try {
      if (isAuthenticated && user) {
        if (inviteToken) {
          if (!/^[A-Za-z0-9_-]+$/.test(inviteToken)) {
            setJoinError(t('events.invalidInvitationToken'));
            return;
          }
          await acceptInvitation.mutateAsync({ eventId, token: inviteToken });
        } else {
          const result = await joinEvent.mutateAsync(eventId);
          if ((result as any)?.participant_id) {
            localStorage.setItem(`member_participant_id_${eventId}`, (result as any).participant_id);
          }
        }
        onJoinSuccess?.({ eventId, viaInvitation: !!inviteToken });
      } else {
        const safeAvatarUrl = profile.avatarUrl?.startsWith('http') ? profile.avatarUrl : undefined;
        const result = await joinAsGuest.mutateAsync({
          eventId,
          data: {
            name: profile.displayName,
            email: guestEmail || undefined,
            avatar_url: safeAvatarUrl,
            token: inviteToken || undefined,
            guest_identity_key: getOrCreateGuestIdentityKey(eventId),
          },
        });
        if (result.guest_token) {
          setGuestToken(eventId, result.guest_token);
          localStorage.setItem(`guest_participant_id_${eventId}`, result.participant_id);
          localStorage.setItem(`guest_name_${eventId}`, result.guest_name || '');
        }
        onJoinSuccess?.({ eventId, viaInvitation: !!inviteToken, guestName: profile.displayName });
      }
      setHasJoined(true);
    } catch (err: any) {
      if (err?.statusCode === 409 || err?.status === 409 || err?.code === 'ALREADY_PARTICIPANT') {
        setHasJoined(true);
      } else {
        const code = err?.response?.data?.code || err?.code;
        if (code === 'EVENT_FULL') {
          setJoinError(t('events.errors.full', 'This event is full. Ask your host if they can increase the limit.'));
        } else if (code === 'NAME_TAKEN') {
          setJoinError(t('events.errors.nameTaken', 'This name is already taken in this lobby. Please choose a slightly different one.'));
        } else if (code === 'GUESTS_NOT_ALLOWED') {
          setJoinError(t('events.errors.guestsNotAllowed', 'This event is for members only. Please sign in or ask your host for access.'));
        } else if (code === 'NOT_A_MEMBER') {
          setJoinError(t('events.errors.notMember', "You're not a member of this workspace for this event."));
        } else if (code === 'SESSION_NOT_ACTIVE') {
          setJoinError(t('events.errors.notActive', "This event isn't active yet — your host needs to start it."));
        } else {
          setJoinError(err?.response?.data?.message || err?.message || t('events.joinFailed'));
        }
      }
    } finally {
      setIsJoining(false);
    }
  }, [
    eventId,
    profile,
    isAuthenticated,
    user,
    inviteToken,
    acceptInvitation,
    joinEvent,
    joinAsGuest,
    guestEmail,
    getOrCreateGuestIdentityKey,
    setGuestToken,
    t,
    onJoinSuccess,
  ]);

  useEffect(() => {
    if (participantId && storedProfile && !hasJoined) setHasJoined(true);
  }, [participantId, storedProfile, hasJoined]);

  useEffect(() => {
    if (
      !isIdentityLoading &&
      profile &&
      !showProfileForm &&
      !hasJoined &&
      !participantId &&
      !isJoining &&
      !joinError
    ) {
      handleJoin();
    }
  }, [profile, showProfileForm, hasJoined, isJoining, joinError, handleJoin, participantId, isIdentityLoading]);

  return { hasJoined, setHasJoined, isJoining, joinError, setJoinError, handleJoin };
}
