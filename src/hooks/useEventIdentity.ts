import { useAuth } from '@/features/app/context/AuthContext';
import { useMyEventParticipant } from '@/hooks/queries/useMyEventParticipant';
import { useEventProfile } from '@/hooks/queries/useEventProfile';
import { getGuestToken, isGuestTokenValid, syncGuestIdentityKeyFromToken } from '@/lib/guestTokenPersistence';
import { useEffect } from 'react';

export interface EventIdentity {
  isGuest: boolean;
  isAuthenticated: boolean;
  userId: string;
  participantId: string | null;
  displayName: string;
  avatarUrl: string | null;
  isLoading: boolean;
}

function decodeJwtPayload(token: string): unknown {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payloadPart = parts[1];
  // base64url -> base64
  const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? 0 : 4 - (base64.length % 4);
  const normalized = base64 + '='.repeat(pad);
  try {
    const json = atob(normalized);
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

export function useEventIdentity(eventId: string | undefined): EventIdentity {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: participant, isLoading: isParticipantLoading } = useMyEventParticipant(eventId);
  const { data: profile, isLoading: isProfileLoading } = useEventProfile(eventId);

  useEffect(() => {
    if (!eventId) return;
    // Self-heal missing local identity key from guest token payload.
    syncGuestIdentityKeyFromToken(eventId);
  }, [eventId]);

  // Fallback: if we still haven't resolved `/events/:id/me` but we already have a guest token,
  // decode the token to recover a stable participantId + guestName. This prevents re-joining
  // (which can trigger NAME_TAKEN on reload).
  const guestToken = eventId ? getGuestToken(eventId) : null;
  const hasValidGuestToken = !!guestToken && isGuestTokenValid(guestToken);
  const decodedGuestPayload = guestToken ? decodeJwtPayload(guestToken) : null;

  type DecodedGuestPayload = {
    isGuest?: boolean;
    eventId?: string;
    participantId?: string;
    guestName?: string;
  };

  const guestLike = decodedGuestPayload && typeof decodedGuestPayload === 'object'
    ? (decodedGuestPayload as DecodedGuestPayload)
    : null;

  const fallbackGuestParticipantId =
    !!guestLike?.isGuest && typeof guestLike?.participantId === 'string' && guestLike.participantId.length > 0
      ? guestLike.participantId
      : null;

  const fallbackGuestEventId = typeof guestLike?.eventId === 'string' ? guestLike.eventId : null;
  const fallbackIsForThisEvent = !!eventId && fallbackGuestEventId === eventId;

  const isGuest = !!participant?.isGuest || (hasValidGuestToken && !!fallbackGuestParticipantId && fallbackIsForThisEvent);

  // For authenticated users, sockets and backend use real user.id as userId.
  // For guests, sockets use a synthetic "guest:{participantId}" userId, but we keep it simple on the client.
  const userId = isGuest ? (participant?.id || (hasValidGuestToken ? fallbackGuestParticipantId : null) || '') : (user?.id || '');
  const participantId = participant?.id || (hasValidGuestToken && fallbackIsForThisEvent ? fallbackGuestParticipantId : null);

  const displayName =
    profile?.display_name ||
    participant?.name ||
    (hasValidGuestToken && fallbackIsForThisEvent && typeof guestLike?.guestName === 'string' ? guestLike.guestName : undefined) ||
    user?.name ||
    'Guest';

  const avatarUrl =
    profile?.avatar_url ||
    participant?.avatar ||
    (user as any)?.avatar_url ||
    null;

  return {
    isGuest,
    isAuthenticated: !!isAuthenticated,
    userId,
    participantId,
    displayName,
    avatarUrl,
    isLoading: isAuthLoading || isParticipantLoading || isProfileLoading,
  };
}

