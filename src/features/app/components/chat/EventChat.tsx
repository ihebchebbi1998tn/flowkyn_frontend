import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, MessageCircle, ChevronDown, Mic, MicOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatMessage {
  id: string;
  userId: string | null;
  participantId: string;
  senderName: string;
  /** Initials fallback (2 chars) */
  senderAvatar: string;
  /** Optional real avatar image URL (data URI or https) */
  senderAvatarUrl?: string | null;
  message: string;
  timestamp: string;
  isOwn?: boolean;
}

interface EventChatProps {
  eventId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  typingUsers?: string[];
  className?: string;
  currentUserId?: string;
  /** When true, backend sends userId as guest:${participantId}; currentUserId is participant ID */
  isGuest?: boolean;
  /** Current user's avatar URL for their own messages */
  currentUserAvatarUrl?: string | null;
  /** Whether the chat transport is currently usable */
  isOnline?: boolean;
  /** Optional ID of the host participant for host badge rendering */
  hostParticipantId?: string;
  /** Currently pinned message ID, if any */
  pinnedMessageId?: string | null;
  /** Called when host wants to pin/unpin a message */
  onTogglePinMessage?: (messageId: string) => void;
  /** Latest participant profiles for live name/avatar hydration of historic messages */
  participantProfiles?: Array<{
    participantId: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  }>;
  /** Voice chat state (from useEventVoiceChat hook) */
  voiceStatus?: string;
  voiceError?: string | null;
  isMuted?: boolean;
  remoteParticipants?: string[];
  voiceStatuses?: Record<string, 'idle' | 'active' | 'muted'>;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  onToggleMute?: () => void;
}

function AvatarBubble({ name, avatarUrl, isOwn }: { name: string; avatarUrl?: string | null; isOwn: boolean }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-background shrink-0"
      />
    );
  }
  return (
    <div className={cn(
      "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ring-background",
      isOwn ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
    )}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export const EventChat = memo(function EventChat({
  eventId,
  messages,
  onSendMessage,
  onTyping,
  typingUsers = [],
  className,
  currentUserId,
  currentUserAvatarUrl,
  isOnline = true,
  hostParticipantId,
  pinnedMessageId,
  onTogglePinMessage,
  participantProfiles = [],
  isGuest = false,
  voiceStatus,
  voiceError,
  isMuted,
  remoteParticipants = [],
  voiceStatuses = {},
  onStartVoice,
  onStopVoice,
  onToggleMute,
}: EventChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleToggleVoice = async () => {
    if (voiceActive) {
      onStopVoice?.();
      setVoiceActive(false);
    } else {
      onStartVoice?.();
      setVoiceActive(true);
    }
  };

  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isAtBottom]);

  // Scroll to bottom on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 40);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !isOnline) return;
    onSendMessage(trimmed);
    setInput('');
    onTyping?.(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.length > 0) {
      onTyping?.(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 2000);
    } else {
      onTyping?.(false);
    }
  };

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const participantProfileMap = useMemo(() => {
    const map = new Map<string, { displayName?: string | null; avatarUrl?: string | null }>();
    for (const p of participantProfiles) {
      if (!p?.participantId) continue;
      map.set(p.participantId, {
        displayName: p.displayName || null,
        avatarUrl: p.avatarUrl || null,
      });
    }
    return map;
  }, [participantProfiles]);

  // Group consecutive messages from same user
  const groupedMessages = messages.reduce<(ChatMessage & { showAvatar: boolean })[]>((acc, msg, i) => {
    const prev = i > 0 ? messages[i - 1] : null;
    const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;
    const prevKey = prev ? `${prev.userId || ''}:${prev.participantId || ''}` : null;
    const currKey = `${msg.userId || ''}:${msg.participantId || ''}`;
    const nextKey = nextMsg ? `${nextMsg.userId || ''}:${nextMsg.participantId || ''}` : null;
    const showAvatar = !prev || prevKey !== currKey;
    const isLastInGroup = !nextMsg || nextKey !== currKey;
    acc.push({ ...msg, showAvatar, isLastInGroup } as any);
    return acc;
  }, []);

  return (
    <div className={cn("flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <MessageCircle className="h-4 w-4 text-primary" />
          <h3 className="text-[13px] font-bold text-foreground">{t('chat.title')}</h3>
        </div>

        {/* Voice Participants Badge (only in header) */}
        <div className="flex items-center gap-2">
          {voiceActive && voiceStatus === 'connected' && (
            <Badge variant="secondary" className="text-[9px] gap-1">
              <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-success" />
              {remoteParticipants.length} {t('chat.voiceActive', { defaultValue: 'voice users' })}
            </Badge>
          )}
        </div>

        <Badge variant="outline" className="text-[9px]">
          {messages.length} {t('chat.messages')}
        </Badge>
      </div>

      {/* Voice Error Message */}
      {voiceActive && voiceError && (
        <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20 text-[11px] text-destructive">
          {voiceError}
        </div>
      )}

      {/* Active Voice Participants Banner */}
      <AnimatePresence>
        {voiceActive && voiceStatus === 'connected' && remoteParticipants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-primary/20 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="flex items-center gap-1"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-semibold text-primary">{t('chat.voiceTalking', { defaultValue: 'Talking:' })}</span>
              </motion.div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {remoteParticipants.map((pId, idx) => {
                  const participant = participantProfiles.find((p) => p.participantId === pId);
                  const status = voiceStatuses[pId] || 'idle';
                  const isTalking = status === 'active';
                  const isMuted = status === 'muted';

                  return (
                    <motion.div
                      key={pId}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium',
                        isTalking
                          ? 'bg-success/15 text-success border border-success/30'
                          : isMuted
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : 'bg-muted/30 text-muted-foreground border border-muted/40'
                      )}
                    >
                      {isTalking ? (
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-success"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      ) : isMuted ? (
                        <MicOff className="h-3 w-3" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      )}
                      <span>{participant?.displayName || 'User'}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1 min-h-0 max-h-none scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[13px] font-medium text-muted-foreground">{t('chat.noMessages')}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{t('chat.beFirst')}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {groupedMessages.map((msg) => {
              const isOwn = msg.isOwn || msg.userId === currentUserId || (isGuest && !!currentUserId && msg.userId === `guest:${currentUserId}`);
              const latestProfile = participantProfileMap.get(msg.participantId);
              const senderNameResolved = latestProfile?.displayName || msg.senderName;
              // Use the message's own avatarUrl, or fall back to currentUserAvatarUrl for own messages
              const avatarUrl = latestProfile?.avatarUrl || msg.senderAvatarUrl || (isOwn ? currentUserAvatarUrl : null);
              const isHost = hostParticipantId && msg.participantId === hostParticipantId;
              const isPinned = pinnedMessageId === msg.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className={cn("flex items-end gap-2 px-1", isOwn ? "flex-row-reverse" : "flex-row",
                    msg.showAvatar ? "mt-3" : "mt-0.5"
                  )}
                >
                  {/* Avatar — only show for last message in group */}
                  <div className="w-8 shrink-0">
                    {(msg as any).isLastInGroup ? (
                      <AvatarBubble name={senderNameResolved} avatarUrl={avatarUrl} isOwn={isOwn} />
                    ) : null}
                  </div>

                  <div className={cn("max-w-[72%] min-w-0 space-y-0.5", isOwn && "items-end flex flex-col")}>
                    {msg.showAvatar && (
                      <p className={cn("text-[10px] font-semibold px-1", isOwn ? "text-right text-primary" : "text-muted-foreground")}>
                        <span>{isOwn ? t('common.you', { defaultValue: 'You' }) : senderNameResolved}</span>
                        {isHost && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                            ★
                            <span>{t('common.host', { defaultValue: 'Host' })}</span>
                          </span>
                        )}
                        {isPinned && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            📌
                          </span>
                        )}
                      </p>
                    )}
                    <div className={cn(
                      "px-3 py-2 text-[13px] leading-relaxed break-words",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                        : "bg-muted/70 text-foreground rounded-2xl rounded-bl-sm"
                    )}>
                      {msg.message}
                    </div>
                    {(msg as any).isLastInGroup && (
                      <div className="flex items-center justify-between px-1">
                        <p className={cn("text-[9px] text-muted-foreground/50", isOwn && "text-right")}>
                          {formatTime(msg.timestamp)}
                        </p>
                        {onTogglePinMessage && !isPinned && isHost && (
                          <button
                            type="button"
                            onClick={() => onTogglePinMessage(msg.id)}
                            className="ml-2 text-[9px] text-muted-foreground hover:text-primary"
                          >
                            {t('chat.pin', { defaultValue: 'Pin' })}
                          </button>
                        )}
                        {onTogglePinMessage && isPinned && isHost && (
                          <button
                            type="button"
                            onClick={() => onTogglePinMessage(msg.id)}
                            className="ml-2 text-[9px] text-primary hover:text-primary/80"
                          >
                            {t('chat.unpin', { defaultValue: 'Unpin' })}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-2 pt-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {typingUsers.slice(0, 3).map((name) => (
                  <div
                    key={name}
                    className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-semibold border border-background"
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="flex gap-0.5 bg-muted/70 px-3 py-2 rounded-2xl rounded-bl-sm">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/60">
              {typingUsers.length === 1 ? t('chat.isTyping', { name: typingUsers[0] }) : t('chat.peopleTyping', { count: typingUsers.length })}
            </span>
          </motion.div>
        )}

        {/* Voice Participants Indicator */}
        {voiceActive && remoteParticipants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 px-2 py-3 bg-primary/5 rounded-lg my-2"
          >
            <span className="text-[9px] font-semibold text-primary flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {t('chat.voiceParticipants', { defaultValue: 'Voice:' })}
            </span>
            <div className="flex flex-wrap gap-1">
              {remoteParticipants.map((pId) => {
                const status = voiceStatuses[pId] || 'idle';
                const participant = participantProfiles.find((p) => p.participantId === pId);
                return (
                  <Badge
                    key={pId}
                    variant={status === 'muted' ? 'secondary' : 'default'}
                    className="text-[9px]"
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full mr-1',
                        status === 'active' ? 'bg-success animate-pulse' : status === 'muted' ? 'bg-muted-foreground' : 'bg-gray-400'
                      )}
                    />
                    {participant?.displayName || 'User'}
                  </Badge>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {!isAtBottom && messages.length > 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="flex justify-center -mt-8 relative z-10"
          >
            <Button variant="outline" size="sm" onClick={scrollToBottom} className="h-7 rounded-full text-[10px] gap-1 shadow-md bg-card">
              <ChevronDown className="h-3 w-3" /> {t('chat.newMessages')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0 bg-card">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          {currentUserAvatarUrl ? (
            <img src={currentUserAvatarUrl} alt={t('common.you', { defaultValue: 'You' })} className="h-7 w-7 rounded-full object-cover shrink-0" />
          ) : null}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={isOnline ? t('chat.placeholder') : t('chat.offlinePlaceholder', { defaultValue: 'You are offline – messages cannot be sent' })}
            maxLength={2000}
            className="h-10 text-[13px] rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors flex-1"
            disabled={!isOnline}
          />
          
          {/* Voice Controls - Next to Send Button */}
          {voiceActive && voiceStatus === 'connected' && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-xl"
              onClick={onToggleMute}
              title={isMuted ? t('chat.unmute', { defaultValue: 'Unmute' }) : t('chat.mute', { defaultValue: 'Mute' })}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4 text-destructive" />
              ) : (
                <Mic className="h-4 w-4 text-success" />
              )}
            </Button>
          )}

          {onStartVoice && onStopVoice && (
            <Button
              type="button"
              size="icon"
              variant={voiceActive ? 'destructive' : 'outline'}
              className="h-10 w-10 rounded-xl shrink-0"
              onClick={handleToggleVoice}
              title={voiceActive ? t('chat.stopVoice', { defaultValue: 'Stop voice' }) : t('chat.startVoice', { defaultValue: 'Start voice' })}
            >
              {voiceActive ? <PhoneOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Button
            type="submit" size="icon" disabled={!input.trim() || !isOnline}
            className="h-10 w-10 rounded-xl shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
});
