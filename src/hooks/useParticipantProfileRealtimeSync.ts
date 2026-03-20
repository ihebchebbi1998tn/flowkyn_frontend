import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type ProfilePayload = {
  eventId?: string;
  participantId?: string;
  displayName?: string;
  avatarUrl?: string | null;
};

type SocketLike = {
  isConnected: boolean;
  on: (event: string, handler: (payload: ProfilePayload) => void) => (() => void) | void;
};

type ProfileState = {
  displayName: string;
  avatarUrl: string;
};

interface UseParticipantProfileRealtimeSyncOptions {
  eventId?: string;
  participantId?: string | null;
  refetchParticipants: () => void;
  eventsSocket?: SocketLike;
  gamesSocket?: SocketLike;
  setOwnProfile?: Dispatch<SetStateAction<ProfileState | null>>;
  logPrefix?: string;
}

/**
 * Keep participant names/avatars synced in real time across lobby + game screens.
 * Listens to both /events and /games profile update events and triggers a participant refetch.
 */
export function useParticipantProfileRealtimeSync({
  eventId,
  participantId,
  refetchParticipants,
  eventsSocket,
  gamesSocket,
  setOwnProfile,
  logPrefix = 'ProfileSync',
}: UseParticipantProfileRealtimeSyncOptions) {
  useEffect(() => {
    const applyLocalProfileIfCurrentUser = (payload: ProfilePayload) => {
      if (!setOwnProfile) return;
      if (!payload || !payload.participantId || !participantId) return;
      if (payload.participantId !== participantId) return;
      // Important: allow explicit clearing.
      // If the server sends `displayName: ""` we should update to empty (not keep previous).
      // If the server sends `avatarUrl: null` we should clear local avatarUrl.
      const hasDisplayName =
        typeof payload.displayName === 'string';
      const hasAvatar =
        typeof payload.avatarUrl === 'string' || payload.avatarUrl === null;

      const nextName = hasDisplayName ? payload.displayName : undefined;
      const nextAvatar =
        typeof payload.avatarUrl === 'string'
          ? payload.avatarUrl
          : payload.avatarUrl === null
            ? ''
            : undefined;
      setOwnProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          displayName: hasDisplayName ? nextName ?? '' : prev.displayName,
          avatarUrl: hasAvatar ? nextAvatar ?? '' : prev.avatarUrl,
        };
      });
    };

    const handleProfileUpdated = (payload: ProfilePayload) => {
      if (eventId && payload?.eventId && payload.eventId !== eventId) return;
      console.log(`[${logPrefix}] participant profile updated, refetching participants`, payload);
      applyLocalProfileIfCurrentUser(payload);
      refetchParticipants();
    };

    const unsubEvents = eventsSocket?.isConnected
      ? eventsSocket.on('event:participant_profile_updated', handleProfileUpdated)
      : undefined;
    const unsubGames = gamesSocket?.isConnected
      ? gamesSocket.on('game:participant_profile_updated', handleProfileUpdated)
      : undefined;

    return () => {
      unsubEvents?.();
      unsubGames?.();
    };
  }, [
    eventId,
    eventsSocket,
    eventsSocket?.isConnected,
    gamesSocket,
    gamesSocket?.isConnected,
    logPrefix,
    participantId,
    refetchParticipants,
    setOwnProfile,
  ]);
}

