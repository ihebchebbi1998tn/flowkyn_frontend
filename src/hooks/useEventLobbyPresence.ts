/**
 * Event room join + presence sync for EventLobby.
 * Handles event:join, event:presence, participant join/leave, reconnect backfill, fallback polling.
 */
import { useEffect, useRef } from 'react';

type EventsSocketApi = {
  isConnected: boolean;
  status: string;
  socket: { connected?: boolean; emit: (ev: string, payload: { eventId: string }) => void } | null;
  emit: (ev: string, payload: { eventId: string }) => Promise<unknown>;
  on: (ev: string, handler: (data?: any) => void) => (() => void) | void;
  connect: () => void;
};

type Options = {
  eventId: string | null;
  hasJoined: boolean;
  isGuest: boolean;
  eventsSocket: EventsSocketApi;
  identityRef: React.MutableRefObject<{ isGuest: boolean }>;
  refetchParticipants: () => void;
  setOnlineCount: (n: number | null) => void;
  setIsSyncing: (v: boolean) => void;
  showError: (err: unknown, message: string) => void;
  tJoinRoomFailed: string;
};

export function useEventLobbyPresence({
  eventId,
  hasJoined,
  isGuest,
  eventsSocket,
  identityRef,
  refetchParticipants,
  setOnlineCount,
  setIsSyncing,
  showError,
  tJoinRoomFailed,
}: Options) {
  const eventsSocketRef = useRef(eventsSocket);
  eventsSocketRef.current = eventsSocket;

  useEffect(() => {
    if (hasJoined && !eventsSocket.isConnected && eventsSocket.status === 'disconnected') {
      eventsSocket.connect();
    }
  }, [hasJoined, eventsSocket]);

  useEffect(() => {
    if (!eventId || !eventsSocket.isConnected) return;
    const sock = eventsSocketRef.current;
    sock
      .emit('event:join', { eventId })
      .then((ack: any) => {
        if (ack?.data?.participantId) {
          if (identityRef.current.isGuest) {
            localStorage.setItem(`guest_participant_id_${eventId}`, ack.data.participantId);
          } else {
            localStorage.setItem(`member_participant_id_${eventId}`, ack.data.participantId);
          }
        }
        sock.emit('event:presence', { eventId }).catch(() => {});
      })
      .catch((err: any) => {
        showError(err, tJoinRoomFailed);
      });
  }, [hasJoined, eventId, eventsSocket.isConnected, showError, tJoinRoomFailed, identityRef]);

  useEffect(() => {
    if (!eventsSocket.isConnected || !eventId) return;

    const handlePresence = (payload: any) => {
      if (payload?.eventId !== eventId || !Array.isArray(payload.onlineUserIds)) return;
      setOnlineCount(payload.onlineUserIds.length);
    };

    const handleUserJoined = () => {
      refetchParticipants();
      eventsSocket.emit('event:presence', { eventId }).catch(() => {});
    };

    const handleUserLeft = () => {
      refetchParticipants();
      eventsSocket.emit('event:presence', { eventId }).catch(() => {});
    };

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
      if (typeof unsubNotification === 'function') unsubNotification();
      if (typeof unsubPresence === 'function') unsubPresence();
      if (typeof unsubJoined === 'function') unsubJoined();
      if (typeof unsubLeft === 'function') unsubLeft();
    };
  }, [eventsSocket.isConnected, eventId, refetchParticipants, eventsSocket, setOnlineCount]);

  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (eventsSocket.status === 'connected') {
      if (!wasConnectedRef.current) {
        wasConnectedRef.current = true;
        if (eventId) {
          setIsSyncing(true);
          Promise.all([refetchParticipants()])
            .catch(() => {})
            .finally(() => setIsSyncing(false));
        }
      }
    } else {
      wasConnectedRef.current = false;
    }
  }, [eventsSocket.status, eventId, refetchParticipants, setIsSyncing]);

  useEffect(() => {
    if (!eventId) return;
    const interval = setInterval(() => refetchParticipants(), 6000);
    return () => clearInterval(interval);
  }, [eventId, refetchParticipants]);

  useEffect(() => {
    return () => {
      if (eventId && eventsSocket.socket?.connected) {
        eventsSocket.socket.emit('event:leave', { eventId });
      }
    };
  }, [eventId, eventsSocket.socket]);
}
