import { useEffect, useRef, useState } from 'react';

type SocketLike = {
  isConnected: boolean;
  on: (event: string, handler: (...args: any[]) => void) => (() => void) | void;
};

interface UseParticipantPresenceSyncOptions {
  eventId?: string;
  sessionId?: string | null;
  eventsSocket: SocketLike;
  gamesSocket: SocketLike;
  refetchParticipants: () => void;
}

/**
 * Sync participant presence across event + game rooms and expose
 * a short-lived "user disconnected" badge counter for UI shells.
 */
export function useParticipantPresenceSync({
  eventId,
  sessionId,
  eventsSocket,
  gamesSocket,
  refetchParticipants,
}: UseParticipantPresenceSyncOptions) {
  const [disconnectedBadgeCount, setDisconnectedBadgeCount] = useState(0);
  const disconnectedBadgeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!eventsSocket.isConnected || !eventId) return;
    const triggerRefetch = () => {
      console.log('[PresenceSync] Event participant changed, refetching...');
      refetchParticipants();
    };
    const unsubJoin = eventsSocket.on('event:user_joined', triggerRefetch);
    const unsubLeave = eventsSocket.on('event:user_left', triggerRefetch);
    return () => {
      unsubJoin?.();
      unsubLeave?.();
    };
  }, [eventsSocket, eventsSocket.isConnected, eventId, refetchParticipants]);

  useEffect(() => {
    if (!gamesSocket.isConnected || !sessionId) return;

    const triggerRefetchOnJoin = () => {
      console.log('[PresenceSync] Game participant joined, refetching...');
      refetchParticipants();
    };

    const triggerRefetchOnLeave = () => {
      console.log('[PresenceSync] Game participant left, refetching...');
      refetchParticipants();
      setDisconnectedBadgeCount((prev) => prev + 1);
      if (disconnectedBadgeTimerRef.current) {
        window.clearTimeout(disconnectedBadgeTimerRef.current);
      }
      disconnectedBadgeTimerRef.current = window.setTimeout(() => {
        setDisconnectedBadgeCount(0);
      }, 9000);
    };

    const unsubJoin = gamesSocket.on('game:player_joined', triggerRefetchOnJoin);
    const unsubLeave = gamesSocket.on('game:player_left', triggerRefetchOnLeave);
    return () => {
      unsubJoin?.();
      unsubLeave?.();
    };
  }, [gamesSocket, gamesSocket.isConnected, refetchParticipants, sessionId]);

  useEffect(() => {
    return () => {
      if (disconnectedBadgeTimerRef.current) {
        window.clearTimeout(disconnectedBadgeTimerRef.current);
      }
    };
  }, []);

  return { disconnectedBadgeCount };
}

