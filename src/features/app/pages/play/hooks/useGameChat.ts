/**
 * useGameChat — Chat message sending, typing indicators, pin message toggling.
 *
 * Extracted from GamePlay.tsx.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { eventsApi } from '@/features/app/api/events';
import type { ChatMessage } from '@/features/app/components/chat/EventChat';

interface UseGameChatOptions {
  eventId: string | undefined;
  chatReady: boolean;
  eventsSocket: {
    isConnected: boolean;
    emit: (event: string, data?: unknown) => Promise<unknown>;
    on: (event: string, handler: (...args: unknown[]) => void) => (() => void) | void;
  };
  currentUserId: string;
  isGuest: boolean;
  refetchMessages: () => void;
  showError: (err: unknown, label?: string) => void;
  initialMessages: ChatMessage[];
  liveMessages: ChatMessage[];
  pinnedMessage: ChatMessage | null;
  setPinnedMessage: (msg: ChatMessage | null) => void;
}

export function useGameChat({
  eventId,
  chatReady,
  eventsSocket,
  currentUserId,
  isGuest,
  refetchMessages,
  showError,
  initialMessages,
  liveMessages,
  pinnedMessage,
  setPinnedMessage,
}: UseGameChatOptions) {
  const { t } = useTranslation();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const lastChatSentAtRef = useRef<number | null>(null);

  // Typing indicators
  useEffect(() => {
    if (!eventsSocket.isConnected) return;

    const handleTyping = (...args: unknown[]) => {
      const data = args[0] as { userId: string; userName?: string; isTyping: boolean };
      if (data.userId === currentUserId || (isGuest && data.userId === `guest:${currentUserId}`)) return;
      const displayId = data.userName || data.userId;
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(displayId)) return [...prev, displayId];
        if (!data.isTyping) return prev.filter(u => u !== displayId);
        return prev;
      });
    };

    const unsub = eventsSocket.on('chat:typing', handleTyping);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [eventsSocket.isConnected, currentUserId, isGuest]);

  // Send message via WebSocket
  const handleSendMessage = useCallback((message: string) => {
    const now = Date.now();
    if (lastChatSentAtRef.current && now - lastChatSentAtRef.current < 1000) {
      return;
    }
    lastChatSentAtRef.current = now;

    if (chatReady && eventsSocket.isConnected && eventId) {
      eventsSocket.emit('chat:message', { eventId, message })
        .then(() => {
          refetchMessages();
        })
        .catch((err: Error) => {
          console.error('[useGameChat] Failed to send message:', err.message);
          showError(err, t('chat.errors.sendFailed', { defaultValue: 'Failed to send message' }));
        });
    } else {
      refetchMessages();
    }
  }, [eventsSocket.isConnected, eventId, chatReady, showError, refetchMessages, t]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (eventsSocket.isConnected && eventId) {
      eventsSocket.emit('chat:typing', { eventId, isTyping });
    }
  }, [eventsSocket.isConnected, eventId]);

  const handleTogglePinMessage = useCallback(async (messageId: string) => {
    if (!eventId) return;
    try {
      if (pinnedMessage && pinnedMessage.id === messageId) {
        await eventsApi.unpinMessage(eventId);
        setPinnedMessage(null);
      } else {
        await eventsApi.pinMessage(eventId, messageId);
        const source = [...initialMessages, ...liveMessages];
        const msg = source.find(m => m.id === messageId);
        if (msg) {
          setPinnedMessage({ ...msg, isOwn: false });
        }
      }
    } catch (err: unknown) {
      console.error('[useGameChat] Failed to toggle pinned message:', err instanceof Error ? err.message : err);
      showError(err, t('chat.errors.pinFailed', { defaultValue: 'Failed to update pinned message' }));
    }
  }, [eventId, pinnedMessage, initialMessages, liveMessages, showError, setPinnedMessage, t]);

  return {
    typingUsers,
    handleSendMessage,
    handleTyping,
    handleTogglePinMessage,
  };
}
