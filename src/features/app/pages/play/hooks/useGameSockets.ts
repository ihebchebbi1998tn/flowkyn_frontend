/**
 * useGameSockets — Sets up events + games socket connections, error tracking,
 * auto-connect on join, reconnect backfill, and fallback polling.
 *
 * Extracted from GamePlay.tsx.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEventsSocket, useGamesSocket } from '@/hooks/useSocket';
import { useGamePlayEventRoom } from '@/hooks/useGamePlayEventRoom';

interface UseGameSocketsOptions {
  eventId: string | undefined;
  isGuest: boolean;
  isIdentityLoading: boolean;
  hasJoined: boolean;
  participantId: string | null;
  showError: (err: unknown, label?: string) => void;
  refetchMessages: () => void;
  refetchParticipants: () => void;
  refetchPosts: () => void;
  tJoinRoomFailed: string;
  tChatError: string;
  tGameError: string;
}

function extractErrorInfo(e: unknown) {
  const errObj = e as Record<string, unknown> | null;
  return {
    message: String(errObj?.message || errObj?.code || 'Unknown error'),
    code: errObj?.code ? String(errObj.code) : null,
    details: errObj?.details ?? null,
  };
}

export function useGameSockets({
  eventId,
  isGuest,
  isIdentityLoading,
  hasJoined,
  participantId,
  showError,
  refetchMessages,
  refetchParticipants,
  refetchPosts,
  tJoinRoomFailed,
  tChatError,
  tGameError,
}: UseGameSocketsOptions) {
  // Chat socket error state
  const [chatSocketError, setChatSocketError] = useState<string | null>(null);
  const [chatSocketErrorCode, setChatSocketErrorCode] = useState<string | null>(null);
  const [chatSocketErrorDetails, setChatSocketErrorDetails] = useState<unknown>(null);

  const eventsSocket = useEventsSocket({
    eventId: eventId || undefined,
    autoConnect: false,
    authMode: isGuest ? 'guest' : 'access',
    onError: (e) => {
      const info = extractErrorInfo(e);
      setChatSocketError(info.message || tChatError);
      setChatSocketErrorCode(info.code);
      setChatSocketErrorDetails(info.details);
      showError(e, info.message || tChatError);
    },
  });

  const gamesSocket = useGamesSocket({
    eventId: eventId || undefined,
    autoConnect: false,
    authMode: isGuest ? 'guest' : 'access',
    onError: (e) => {
      const info = extractErrorInfo(e);
      showError(e, info.message || tGameError);
    },
  });

  // Clear chat errors on reconnect
  useEffect(() => {
    if (eventsSocket.status === 'connected') {
      setChatSocketError(null);
      setChatSocketErrorCode(null);
      setChatSocketErrorDetails(null);
    }
  }, [eventsSocket.status]);

  // Auto-connect sockets when joined
  useEffect(() => {
    if (!isIdentityLoading && hasJoined && !eventsSocket.isConnected && eventsSocket.status === 'disconnected') {
      eventsSocket.connect();
    }
  }, [hasJoined, eventsSocket, isIdentityLoading]);

  useEffect(() => {
    if (!isIdentityLoading && hasJoined && !gamesSocket.isConnected && gamesSocket.status === 'disconnected') {
      gamesSocket.connect();
    }
  }, [hasJoined, gamesSocket, isIdentityLoading]);

  // Event room join
  const { eventRoomJoined } = useGamePlayEventRoom({
    eventsSocket,
    eventId: eventId || null,
    hasJoined,
    participantId: participantId || null,
    isGuest,
    setChatSocketError,
    setChatSocketErrorCode,
    setChatSocketErrorDetails,
    showError,
    refetchMessages,
    tJoinRoomFailed,
  });

  // Reconnect backfill
  const wasEventsConnectedRef = useRef(false);
  useEffect(() => {
    if (eventsSocket.status === 'connected') {
      if (!wasEventsConnectedRef.current) {
        wasEventsConnectedRef.current = true;
        if (eventId) {
          refetchMessages();
          refetchParticipants();
          refetchPosts();
        }
      }
    } else {
      wasEventsConnectedRef.current = false;
    }
  }, [eventsSocket.status, eventId, refetchMessages, refetchParticipants, refetchPosts]);

  // Fallback polling for messages
  useEffect(() => {
    if (!eventId || !hasJoined) return;
    const interval = setInterval(() => refetchMessages(), 5000);
    return () => clearInterval(interval);
  }, [eventId, hasJoined, refetchMessages]);

  // Participants polling fallback
  useEffect(() => {
    if (!eventId || !hasJoined) return;
    const interval = setInterval(() => refetchParticipants(), 6000);
    return () => clearInterval(interval);
  }, [eventId, hasJoined, refetchParticipants]);

  const chatReady = eventsSocket.status === 'connected' && eventRoomJoined;

  useEffect(() => {
    if (chatReady) setChatSocketError(null);
  }, [chatReady]);

  return {
    eventsSocket,
    gamesSocket,
    chatReady,
    eventRoomJoined,
    chatSocketError,
    chatSocketErrorCode,
    chatSocketErrorDetails,
  };
}
