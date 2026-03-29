/**
 * Join lifecycle for GamePlay: handleJoin, auto-join, hasJoined state.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

type ProfileSetupData = { displayName: string; avatarUrl: string };

type Options = {
  eventId: string | null;
  profile: ProfileSetupData | null;
  participantId: string | null;
  isIdentityLoading: boolean;
  showProfileEdit: boolean;
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
  tJoinFailed: string;
};

export function useGamePlayJoin({
  eventId,
  profile,
  participantId,
  isIdentityLoading,
  showProfileEdit,
  isAuthenticated,
  user,
  inviteToken,
  guestEmail,
  joinEvent,
  joinAsGuest,
  acceptInvitation,
  getOrCreateGuestIdentityKey,
  setGuestToken,
  tJoinFailed,
}: Options) {
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const joinAttemptsRef = useRef(0);

  const handleJoin = useCallback(async () => {
    if (!eventId || !profile || isJoining || hasJoined) return;
    if (joinAttemptsRef.current >= 3) {
      if (!joinError) setJoinError(tJoinFailed || 'Failed to join after multiple attempts');
      return;
    }
    joinAttemptsRef.current += 1;
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
            guest_identity_key: getOrCreateGuestIdentityKey(eventId),
          },
        });
        if (result.guest_token) {
          setGuestToken(eventId, result.guest_token);
          localStorage.setItem(`guest_participant_id_${eventId}`, result.participant_id);
          localStorage.setItem(`guest_name_${eventId}`, result.guest_name || '');
        }
      }
      setHasJoined(true);
    } catch (err: unknown) {
      const errAny = err as any;
      if (errAny?.status === 409 || errAny?.response?.status === 409 || errAny?.statusCode === 409 || errAny?.code === 'ALREADY_PARTICIPANT') {
        setHasJoined(true);
      } else {
        const msg = errAny?.response?.data?.message || errAny?.response?.data?.error || errAny?.message || tJoinFailed || 'Failed to join';
        setJoinError(msg || 'Failed to join');
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
    tJoinFailed,
  ]);

  useEffect(() => {
    if (participantId && !hasJoined) setHasJoined(true);
  }, [participantId, hasJoined]);

  useEffect(() => {
    if (isIdentityLoading) return;
    if (participantId) return;
    if (profile && !showProfileEdit && !hasJoined && !isJoining && !joinError) handleJoin();
  }, [profile, showProfileEdit, hasJoined, isJoining, joinError, participantId, handleJoin, isIdentityLoading]);

  return { hasJoined, setHasJoined, isJoining, joinError, handleJoin };
}
