import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { GamePlayShell } from '@/features/app/components/game/shell';
import type { GameParticipant } from '@/features/app/components/game/shell';
import { TwoTruthsBoard, CoffeeRouletteBoard, WinsOfTheWeekBoard } from '@/features/app/components/game/boards';
import { EventChat, type ChatMessage } from '@/features/app/components/chat/EventChat';
import { ROUTES } from '@/constants/routes';
import { useEventParticipants, useEventMessages } from '@/hooks/queries/useEventQueries';
import { useEventsSocket, useGamesSocket } from '@/hooks/useSocket';
import { useAuth } from '@/features/app/context/AuthContext';

// ─── Game type configs (keys for i18n) ────────────────────────────────────
const GAME_CONFIGS: Record<string, {
  titleKey: string;
  subtitleKey: string;
  type: 'sync' | 'async';
  gameTypeKey: string;
  promptKey?: string;
}> = {
  '1': { titleKey: 'gamePlay.configs.twoTruthsTitle', subtitleKey: 'gamePlay.configs.twoTruthsSubtitle', type: 'sync', gameTypeKey: 'two-truths' },
  '2': { titleKey: 'gamePlay.configs.coffeeRouletteTitle', subtitleKey: 'gamePlay.configs.coffeeRouletteSubtitle', type: 'sync', gameTypeKey: 'coffee-roulette' },
  '3': { titleKey: 'gamePlay.configs.winsOfWeekTitle', subtitleKey: 'gamePlay.configs.winsOfWeekSubtitle', type: 'async', gameTypeKey: 'wins-of-week', promptKey: 'gamePlay.configs.defaultPrompt' },
};

function GamePlayWithoutBoundary() {
  const { id: eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const gameTypeId = searchParams.get('game') || '1';
  const config = GAME_CONFIGS[gameTypeId] || GAME_CONFIGS['1'];

  // Support both authenticated users and guests (use event-specific keys)
  const isGuest = !user && !!localStorage.getItem(`guest_token_${eventId}`);
  const currentUserId = user?.id || localStorage.getItem(`guest_participant_id_${eventId}`) || '';
  const currentUserName = user?.name || localStorage.getItem(`guest_name_${eventId}`) || 'Guest';

  // ─── Real data from API ────────────────────────────────────────────────────
  const { data: participantsData } = useEventParticipants(eventId || '');
  const { data: messagesData } = useEventMessages(eventId || '');

  // Map API participants to GameParticipant shape
  const rawParticipants = (participantsData as any)?.data || [];
  const participants: GameParticipant[] = rawParticipants.map((p: any) => ({
    id: p.id,
    name: p.name || 'Unknown',
    email: p.email || null,
    avatar: (p.name || '??').slice(0, 2).toUpperCase(),
    status: 'joined' as const,
    joinedAt: p.joined_at || null,
    score: 0,
  }));

  // ─── Chat messages (real + live) ───────────────────────────────────────────
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const rawMessages = (messagesData as any)?.data || [];
  const initialMessages: ChatMessage[] = rawMessages.map((m: any) => ({
    id: m.id,
    userId: m.user_id || m.participant_id,
    participantId: m.participant_id,
    senderName: m.user_name || m.guest_name || 'Unknown',
    senderAvatar: (m.user_name || m.guest_name || '??').slice(0, 2).toUpperCase(),
    message: m.message,
    timestamp: m.created_at,
    isOwn: m.user_id === currentUserId,
  }));

  // Merge initial (from API) + live (from WebSocket) — deduplicate by id
  const seenIds = new Set<string>();
  const allMessages = [...initialMessages, ...liveMessages].filter(m => {
    if (seenIds.has(m.id)) return false;
    seenIds.add(m.id);
    return true;
  });

  // ─── WebSocket: Events namespace (chat) ────────────────────────────────────
  const eventsSocket = useEventsSocket({
    onConnect: () => {
      if (eventId) {
        eventsSocket.emit('event:join', { eventId });
      }
    },
  });

  // Listen for incoming chat messages
  const liveMessagesRef = useRef(liveMessages);
  liveMessagesRef.current = liveMessages;

  useEffect(() => {
    if (!eventsSocket.isConnected) return;

    const handleChatMessage = (data: any) => {
      // senderName is now provided by the backend (resolved server-side)
      const name = data.senderName || 'Player';
      const msg: ChatMessage = {
        id: data.id || `ws-${Date.now()}`,
        userId: data.userId,
        participantId: data.participantId,
        senderName: name,
        senderAvatar: name.slice(0, 2).toUpperCase(),
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        isOwn: data.userId === currentUserId,
      };
      setLiveMessages(prev => [...prev, msg]);
    };

    const unsub = eventsSocket.on('chat:message', handleChatMessage);
    return unsub;
  }, [eventsSocket.isConnected, currentUserId]);

  // Cleanup: leave event room on unmount
  useEffect(() => {
    return () => {
      if (eventId && eventsSocket.isConnected) {
        eventsSocket.emit('event:leave', { eventId });
      }
    };
  }, [eventId]);

  // ─── WebSocket: Games namespace ────────────────────────────────────────────
  const gamesSocket = useGamesSocket();

  // ─── Typing state ──────────────────────────────────────────────────────────
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!eventsSocket.isConnected) return;

    const handleTyping = (data: { userId: string; userName?: string; isTyping: boolean }) => {
      if (data.userId === currentUserId) return;
      // Use userName (display name) from backend instead of userId (UUID)
      const displayId = data.userName || data.userId;
      setTypingUsers(prev => {
        if (data.isTyping && !prev.includes(displayId)) return [...prev, displayId];
        if (!data.isTyping) return prev.filter(u => u !== displayId);
        return prev;
      });
    };

    const unsub = eventsSocket.on('chat:typing', handleTyping);
    return unsub;
  }, [eventsSocket.isConnected, currentUserId]);

  // ─── Send message via WebSocket ────────────────────────────────────────────
  const handleSendMessage = useCallback((message: string) => {
    if (eventsSocket.isConnected && eventId) {
      eventsSocket.emit('chat:message', { eventId, message });
    } else {
      // Fallback: optimistic local message
      const newMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        userId: currentUserId,
        participantId: '',
        senderName: currentUserName,
        senderAvatar: currentUserName.slice(0, 2).toUpperCase(),
        message,
        timestamp: new Date().toISOString(),
        isOwn: true,
      };
      setLiveMessages(prev => [...prev, newMsg]);
    }
  }, [eventsSocket.isConnected, eventId, currentUserId, user]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (eventsSocket.isConnected && eventId) {
      eventsSocket.emit('chat:typing', { eventId, isTyping });
    }
  }, [eventsSocket.isConnected, eventId]);

  // ─── Chat sidebar ──────────────────────────────────────────────────────────
  const chatSidebar = (
    <div className="space-y-4 sticky top-16">
      <EventChat
        eventId={eventId || ''}
        messages={allMessages}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
      />
    </div>
  );

  // ─── Game board ────────────────────────────────────────────────────────────
  const renderBoard = () => {
    switch (config.gameTypeKey) {
      case 'two-truths':
        return <TwoTruthsBoard />;
      case 'coffee-roulette':
        return <CoffeeRouletteBoard />;
      case 'wins-of-week':
        return <WinsOfTheWeekBoard prompt={config.promptKey ? t(config.promptKey) : undefined} />;
      default:
        return <TwoTruthsBoard />;
    }
  };

  return (
    <GamePlayShell
      title={t(config.titleKey)}
      subtitle={t(config.subtitleKey)}
      gameType={config.type}
      eventId={eventId || ''}
      participants={participants}
      onEnd={() => navigate(ROUTES.EVENTS)}
      sidebar={chatSidebar}
    >
      {renderBoard()}
    </GamePlayShell>
  );
}

export default function GamePlay() {
  return (
    <ErrorBoundary>
      <GamePlayWithoutBoundary />
    </ErrorBoundary>
  );
}
