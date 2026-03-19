import { useEffect, useMemo, useState } from 'react';
import type { MutableRefObject } from 'react';
import { eventsApi } from '@/features/app/api/events';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import type { ChatMessage } from '@/features/app/components/chat/EventChat';

type SocketLike = {
  isConnected: boolean;
  on: (event: string, handler: (...args: any[]) => void) => (() => void) | void;
};

type IdentityLike = {
  isGuest?: boolean;
  participantId?: string | null;
};

type UserLike = {
  id?: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function getDataArray(v: unknown): unknown[] {
  if (isRecord(v) && Array.isArray(v.data)) return v.data as unknown[];
  return [];
}

interface UseGameChatStateOptions {
  eventId?: string;
  messagesData: unknown;
  isGuest: boolean;
  guestParticipantId: string | null;
  userId?: string | null;
  tUnknown: string;
  eventsSocket: SocketLike;
  identityRef: MutableRefObject<IdentityLike>;
  userRef: MutableRefObject<UserLike | null | undefined>;
}

export function useGameChatState({
  eventId,
  messagesData,
  isGuest,
  guestParticipantId,
  userId,
  tUnknown,
  eventsSocket,
  identityRef,
  userRef,
}: UseGameChatStateOptions) {
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);

  const rawMessages = getDataArray(messagesData);
  const initialMessages: ChatMessage[] = useMemo(
    () =>
      rawMessages
        .filter((m) => isRecord(m) && typeof m.id === 'string' && typeof m.message === 'string')
        .map((m) => ({
          id: String((m as any).id),
          userId: (m as any).user_id || (m as any).participant_id,
          participantId: (m as any).participant_id,
          senderName: (m as any).user_name || (m as any).guest_name || tUnknown,
          senderAvatar: String((m as any).user_name || (m as any).guest_name || '??').slice(0, 2).toUpperCase(),
          senderAvatarUrl: (m as any).avatar_url || null,
          message: String((m as any).message),
          timestamp: String((m as any).created_at),
          isOwn: isGuest
            ? (m as any).participant_id === guestParticipantId
            : !!((m as any).user_id && (m as any).user_id === userId),
        })),
    [rawMessages, tUnknown, isGuest, guestParticipantId, userId]
  );

  const allMessages = useMemo(
    () =>
      [...(pinnedMessage ? [pinnedMessage] : []), ...initialMessages, ...liveMessages].filter(
        (m, i, self) => i === self.findIndex((t) => t.id === m.id)
      ),
    [pinnedMessage, initialMessages, liveMessages]
  );

  const makeWsId = () =>
    `ws-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  useEffect(() => {
    if (!eventsSocket.isConnected) {
      console.log('[useGameChatState] Chat listener: socket not connected');
      return;
    }

    const handleChatMessage = (data: any) => {
      const idCurrent = identityRef.current;
      const usr = userRef.current;
      const name = data.senderName || 'Player';
      const isOwn = idCurrent?.isGuest
        ? data.participantId === idCurrent.participantId
        : !!(data.userId && data.userId === usr?.id);

      const msg: ChatMessage = {
        id: data.id || makeWsId(),
        userId: data.userId,
        participantId: data.participantId,
        senderName: name,
        senderAvatar: name.slice(0, 2).toUpperCase(),
        senderAvatarUrl: getSafeImageUrl(data.senderAvatarUrl) || null,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        isOwn,
      };

      setLiveMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const unsub = eventsSocket.on('chat:message', handleChatMessage);
    return unsub;
  }, [eventsSocket, eventsSocket.isConnected, eventId, identityRef, userRef]);

  useEffect(() => {
    if (!eventId) return;
    eventsApi
      .getPinnedMessage(eventId)
      .then((row: any) => {
        if (!row) {
          setPinnedMessage(null);
          return;
        }
        const name = row.user_name || 'Player';
        setPinnedMessage({
          id: row.id,
          userId: row.user_id || row.participant_id,
          participantId: row.participant_id,
          senderName: name,
          senderAvatar: (name || '??').slice(0, 2).toUpperCase(),
          senderAvatarUrl: getSafeImageUrl(row.avatar_url) || null,
          message: row.message,
          timestamp: row.created_at,
          isOwn: false,
        });
      })
      .catch(() => {
        // Non-fatal; ignore errors here to avoid breaking game play.
      });
  }, [eventId]);

  return {
    allMessages,
    initialMessages,
    liveMessages,
    pinnedMessage,
    setPinnedMessage,
  };
}

