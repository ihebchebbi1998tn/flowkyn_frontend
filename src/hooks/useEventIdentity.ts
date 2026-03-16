import { useAuth } from '@/features/app/context/AuthContext';
import { useMyEventParticipant } from '@/hooks/queries/useMyEventParticipant';
import { useEventProfile } from '@/hooks/queries/useEventProfile';

export interface EventIdentity {
  isGuest: boolean;
  isAuthenticated: boolean;
  userId: string;
  participantId: string | null;
  displayName: string;
  avatarUrl: string | null;
  isLoading: boolean;
}

export function useEventIdentity(eventId: string | undefined): EventIdentity {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: participant, isLoading: isParticipantLoading } = useMyEventParticipant(eventId);
  const { data: profile, isLoading: isProfileLoading } = useEventProfile(eventId);

  const isGuest = !!participant?.isGuest;

  // For authenticated users, sockets and backend use real user.id as userId.
  // For guests, sockets use a synthetic "guest:{participantId}" userId, but we keep it simple on the client.
  const userId = isGuest ? (participant?.id || '') : (user?.id || '');
  const participantId = participant?.id || null;

  const displayName =
    profile?.display_name ||
    participant?.name ||
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

