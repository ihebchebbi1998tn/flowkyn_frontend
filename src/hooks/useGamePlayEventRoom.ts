/**
 * Encapsulates event-room join logic with retries for GamePlay.
 * Handles event:join emit, ack handling, retry on failure, refetch on reconnect.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

type EventsSocketApi = {
  isConnected: boolean;
  status: string;
  socket: { connected?: boolean; emit: (ev: string, payload: { eventId: string }) => void; on: (ev: string, fn: () => void) => void; off: (ev: string, fn: () => void) => void } | null;
  emit: (ev: string, payload: { eventId: string }) => Promise<unknown>;
};

type Options = {
  eventsSocket: EventsSocketApi;
  eventId: string | null;
  hasJoined: boolean;
  participantId: string | null;
  isGuest: boolean;
  setChatSocketError: (v: string | null) => void;
  setChatSocketErrorCode: (v: string | null) => void;
  setChatSocketErrorDetails: (v: unknown) => void;
  showError: (err: unknown, message: string) => void;
  refetchMessages: () => void;
  tJoinRoomFailed: string;
};

export function useGamePlayEventRoom({
  eventsSocket,
  eventId,
  hasJoined,
  participantId,
  isGuest,
  setChatSocketError,
  setChatSocketErrorCode,
  setChatSocketErrorDetails,
  showError,
  refetchMessages,
  tJoinRoomFailed,
}: Options) {
  const [eventRoomJoined, setEventRoomJoined] = useState(false);
  const hasJoinedEventRoomRef = useRef(false);
  const eventJoinAttemptsRef = useRef(0);
  const joinEventRoomRef = useRef<() => void>(() => {});

  useEffect(() => {
    hasJoinedEventRoomRef.current = false;
    eventJoinAttemptsRef.current = 0;
  }, [eventId]);

  useEffect(() => {
    if (eventsSocket.status !== 'connected') {
      hasJoinedEventRoomRef.current = false;
      eventJoinAttemptsRef.current = 0;
      setEventRoomJoined(false);
    }
  }, [eventsSocket.status]);

  const joinEventRoom = useCallback(() => {
    if (!eventsSocket.isConnected || !eventId || (!hasJoined && !participantId) || hasJoinedEventRoomRef.current) return;

    const retry = () => {
      if (eventsSocket.isConnected && eventId && (hasJoined || participantId) && !hasJoinedEventRoomRef.current) {
        joinEventRoomRef.current();
      }
    };

    eventsSocket
      .emit('event:join', { eventId })
      .then((resp: any) => {
        const resolvedParticipantId = resp?.participantId || resp?.data?.participantId || null;
        if (resolvedParticipantId) {
          hasJoinedEventRoomRef.current = true;
          setEventRoomJoined(true);
          eventJoinAttemptsRef.current = 0;
          if (isGuest) {
            localStorage.setItem(`guest_participant_id_${eventId}`, resolvedParticipantId);
          } else {
            localStorage.setItem(`member_participant_id_${eventId}`, resolvedParticipantId);
          }
        } else {
          const fallback = 'event:join rejected (no participantId returned)';
          const exactFromAck = resp?.error || resp?.code || fallback;
          setChatSocketError(String(exactFromAck));
          setChatSocketErrorCode(resp?.code ? String(resp.code) : null);
          setChatSocketErrorDetails(resp?.details ?? resp?.data?.details ?? null);
          const nextAttempt = eventJoinAttemptsRef.current + 1;
          eventJoinAttemptsRef.current = nextAttempt;
          if (nextAttempt <= 10) setTimeout(retry, Math.min(4000, 500 * nextAttempt));
        }
      })
      .catch((err) => {
        setChatSocketError(String(err?.message || err || 'Failed to join event room'));
        setChatSocketErrorCode((err as any)?.code ? String((err as any).code) : null);
        setChatSocketErrorDetails((err as any)?.details ?? null);
        const nextAttempt = eventJoinAttemptsRef.current + 1;
        eventJoinAttemptsRef.current = nextAttempt;
        if (nextAttempt <= 10) setTimeout(retry, Math.min(4000, 500 * nextAttempt));
        showError(err, tJoinRoomFailed);
      });
  }, [
    eventsSocket.isConnected,
    eventId,
    isGuest,
    showError,
    hasJoined,
    participantId,
    setChatSocketError,
    setChatSocketErrorCode,
    setChatSocketErrorDetails,
    tJoinRoomFailed,
  ]);

  joinEventRoomRef.current = joinEventRoom;

  useEffect(() => {
    if (eventsSocket.isConnected && eventId && (hasJoined || participantId)) joinEventRoom();
  }, [eventsSocket.isConnected, eventId, joinEventRoom, hasJoined, participantId]);

  useEffect(() => {
    if (!eventsSocket.socket) return;
    const onConnect = () => {
      joinEventRoom();
      refetchMessages();
    };
    eventsSocket.socket.on('connect', onConnect);
    return () => {
      eventsSocket.socket?.off('connect', onConnect);
    };
  }, [eventsSocket.socket, joinEventRoom, refetchMessages]);

  useEffect(() => {
    return () => {
      if (eventId && eventsSocket.socket?.connected) {
        eventsSocket.socket.emit('event:leave', { eventId });
      }
    };
  }, [eventId, eventsSocket.socket]);

  return { eventRoomJoined, setEventRoomJoined, joinEventRoom };
}
