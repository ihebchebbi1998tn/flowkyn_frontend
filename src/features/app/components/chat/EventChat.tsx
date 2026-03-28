import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, MessageCircle, ChevronDown, Mic, MicOff, PhoneOff, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiReactionPicker } from './EmojiReactionPicker';
import { ReactionBar } from './ReactionBar';
import type { Reaction } from './ReactionBar';

export interface ChatMessage {
  id: string;
  userId: string | null;
  participantId: string;
  senderName: string;
  senderAvatar: string;
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
  isGuest?: boolean;
  currentUserAvatarUrl?: string | null;
  isOnline?: boolean;
  hostParticipantId?: string;
  pinnedMessageId?: string | null;
  onTogglePinMessage?: (messageId: string) => void;
  /** Emoji reactions per message: { [messageId]: Reaction[] } */
  reactions?: Record<string, Reaction[]>;
  /** Called when user toggles an emoji reaction */
  onToggleReaction?: (messageId: string, emoji: string) => void;
  participantProfiles?: Array<{
    participantId: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  }>;
  voiceStatus?: string;
  voiceError?: string | null;
  isMuted?: boolean;
  remoteParticipants?: string[];
  voiceStatuses?: Record<string, 'idle' | 'active' | 'muted'>;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  onToggleMute?: () => void;
}

/* ─── Avatar ─── */
function AvatarBubble({ name, avatarUrl, isOwn }: { name: string; avatarUrl?: string | null; isOwn: boolean }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-card shrink-0 shadow-sm"
      />
    );
  }
  return (
    <div className={cn(
      "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm",
      isOwn
        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
        : "bg-accent text-accent-foreground ring-2 ring-border"
    )}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

/* ─── Pinned Message Banner ─── */
function PinnedBanner({ message, onUnpin, canUnpin }: { message: ChatMessage; onUnpin?: () => void; canUnpin: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-primary/20 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-4 py-2.5"
    >
      <div className="flex items-center gap-2">
        <Pin className="h-3 w-3 text-primary shrink-0" />
        <p className="text-[11px] text-foreground font-medium truncate flex-1">
          <span className="text-primary font-semibold mr-1">{message.senderName}:</span>
          {message.message}
        </p>
        {canUnpin && onUnpin && (
          <button onClick={onUnpin} className="text-[9px] text-muted-foreground hover:text-primary transition-colors shrink-0">✕</button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main Chat Component ─── */
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
  reactions: reactionsProp = {},
  onToggleReaction: onToggleReactionProp,
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

  // Local reactions state (merges with prop-provided reactions)
  const [localReactions, setLocalReactions] = useState<Record<string, Reaction[]>>({});

  // Merge prop reactions with local state
  const mergedReactions = useMemo(() => {
    const merged: Record<string, Reaction[]> = { ...reactionsProp };
    for (const [msgId, localArr] of Object.entries(localReactions)) {
      if (!merged[msgId]) {
        merged[msgId] = localArr;
      } else {
        // Merge: local wins for overlap
        const existing = new Map(merged[msgId].map(r => [r.emoji, r]));
        for (const lr of localArr) existing.set(lr.emoji, lr);
        merged[msgId] = Array.from(existing.values());
      }
    }
    return merged;
  }, [reactionsProp, localReactions]);

  const handleToggleReaction = useCallback((messageId: string, emoji: string) => {
    // If parent provides handler, delegate
    if (onToggleReactionProp) {
      onToggleReactionProp(messageId, emoji);
    }
    // Always update local state for instant feedback
    setLocalReactions((prev) => {
      const existing = prev[messageId] || reactionsProp[messageId] || [];
      const idx = existing.findIndex(r => r.emoji === emoji);
      let updated: Reaction[];
      if (idx >= 0) {
        const r = existing[idx];
        if (r.reacted) {
          // Un-react
          updated = r.count <= 1
            ? existing.filter((_, i) => i !== idx)
            : existing.map((r2, i) => i === idx ? { ...r2, count: r2.count - 1, reacted: false } : r2);
        } else {
          // React
          updated = existing.map((r2, i) => i === idx ? { ...r2, count: r2.count + 1, reacted: true } : r2);
        }
      } else {
        // New reaction
        updated = [...existing, { emoji, count: 1, reacted: true }];
      }
      return { ...prev, [messageId]: updated };
    });
  }, [onToggleReactionProp, reactionsProp]);

  const handleToggleVoice = () => {
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
      map.set(p.participantId, { displayName: p.displayName || null, avatarUrl: p.avatarUrl || null });
    }
    return map;
  }, [participantProfiles]);

  const pinnedMsg = pinnedMessageId ? messages.find(m => m.id === pinnedMessageId) : null;
  const isCurrentUserHost = hostParticipantId === currentUserId;

  // Group consecutive messages from same sender
  const groupedMessages = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;
      const currKey = `${msg.userId || ''}:${msg.participantId || ''}`;
      const prevKey = prev ? `${prev.userId || ''}:${prev.participantId || ''}` : null;
      const nextKey = next ? `${next.userId || ''}:${next.participantId || ''}` : null;
      return {
        ...msg,
        showHeader: prevKey !== currKey,
        isLastInGroup: nextKey !== currKey,
      };
    });
  }, [messages]);

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden",
      "rounded-2xl border border-border/80 bg-card shadow-lg",
      "backdrop-blur-sm",
      className
    )}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
            </div>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
            )}
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-foreground leading-none">{t('chat.title')}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isOnline ? t('chat.online', { defaultValue: 'Live' }) : t('chat.offline', { defaultValue: 'Offline' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {voiceActive && voiceStatus === 'connected' && (
            <Badge variant="secondary" className="text-[9px] gap-1 bg-success/10 text-success border-success/20">
              <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-success" />
              {remoteParticipants.length} {t('chat.voiceActive', { defaultValue: 'in voice' })}
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] font-mono bg-muted/30">
            {messages.length}
          </Badge>
        </div>
      </div>

      {/* ─── Voice Error ─── */}
      {voiceActive && voiceError && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-[11px] text-destructive font-medium">
          {voiceError}
        </div>
      )}

      {/* ─── Voice Participants ─── */}
      <AnimatePresence>
        {voiceActive && voiceStatus === 'connected' && remoteParticipants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border/40 bg-muted/20 px-4 py-2.5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                {t('chat.voiceTalking', { defaultValue: 'Voice:' })}
              </span>
              {remoteParticipants.map((pId) => {
                const participant = participantProfiles.find((p) => p.participantId === pId);
                const status = voiceStatuses[pId] || 'idle';
                return (
                  <span
                    key={pId}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border',
                      status === 'active'
                        ? 'bg-success/10 text-success border-success/25'
                        : status === 'muted'
                          ? 'bg-destructive/10 text-destructive border-destructive/25'
                          : 'bg-muted/40 text-muted-foreground border-border/40'
                    )}
                  >
                    {status === 'active' ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    ) : status === 'muted' ? (
                      <MicOff className="h-2.5 w-2.5" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    )}
                    {participant?.displayName || 'User'}
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Pinned Message ─── */}
      <AnimatePresence>
        {pinnedMsg && (
          <PinnedBanner
            message={pinnedMsg}
            canUnpin={isCurrentUserHost}
            onUnpin={() => onTogglePinMessage?.(pinnedMsg.id)}
          />
        )}
      </AnimatePresence>

      {/* ─── Messages ─── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 min-h-0 scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/30 flex items-center justify-center mb-4 shadow-sm">
              <MessageCircle className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t('chat.noMessages')}</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
              {t('chat.beFirst')}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {groupedMessages.map((msg) => {
              const isOwn = msg.isOwn || msg.userId === currentUserId || (isGuest && !!currentUserId && msg.userId === `guest:${currentUserId}`);
              const latestProfile = participantProfileMap.get(msg.participantId);
              const senderName = latestProfile?.displayName || msg.senderName;
              const avatarUrl = latestProfile?.avatarUrl || msg.senderAvatarUrl || (isOwn ? currentUserAvatarUrl : null);
              const isHost = hostParticipantId && msg.participantId === hostParticipantId;
              const isPinned = pinnedMessageId === msg.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={cn(
                    "group flex items-end gap-2 px-1",
                    isOwn ? "flex-row-reverse" : "flex-row",
                    msg.showHeader ? "mt-4" : "mt-0.5"
                  )}
                >
                  {/* Avatar slot */}
                  <div className="w-8 shrink-0">
                    {msg.isLastInGroup && (
                      <AvatarBubble name={senderName} avatarUrl={avatarUrl} isOwn={isOwn} />
                    )}
                  </div>

                  <div className={cn("max-w-[75%] min-w-0", isOwn && "flex flex-col items-end")}>
                    {/* Sender name + badges */}
                    {msg.showHeader && (
                      <div className={cn("flex items-center gap-1.5 px-1 mb-1", isOwn && "flex-row-reverse")}>
                        <span className={cn(
                          "text-[10px] font-semibold",
                          isOwn ? "text-primary" : "text-foreground/70"
                        )}>
                          {isOwn ? t('common.you', { defaultValue: 'You' }) : senderName}
                        </span>
                        {isHost && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full border border-warning/20">
                            ★ {t('common.host', { defaultValue: 'Host' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message bubble + action toolbar */}
                    <div className="relative">
                      <div className={cn(
                        "relative px-3.5 py-2.5 text-[13px] leading-relaxed break-words transition-shadow",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm shadow-primary/20"
                          : "bg-muted/60 text-foreground rounded-2xl rounded-bl-md border border-border/40",
                        isPinned && "ring-1 ring-primary/40"
                      )}>
                        {msg.message}
                      </div>

                      {/* Floating action bar on hover */}
                      <div className={cn(
                        "absolute -top-3 flex items-center gap-0.5",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10",
                        isOwn ? "left-0" : "right-0"
                      )}>
                        {/* Emoji picker */}
                        <EmojiReactionPicker
                          onSelect={(emoji) => handleToggleReaction(msg.id, emoji)}
                        />
                        {/* Pin action */}
                        {onTogglePinMessage && isCurrentUserHost && (
                          <motion.button
                            type="button"
                            onClick={() => onTogglePinMessage(msg.id)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center",
                              "bg-card/90 border border-border/60 shadow-sm backdrop-blur-sm",
                              "hover:bg-primary/10 hover:border-primary/30",
                              "transition-colors duration-150",
                              isPinned && "bg-primary/10 border-primary/30"
                            )}
                          >
                            <Pin className={cn("h-3 w-3", isPinned ? "text-primary" : "text-muted-foreground")} />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Reaction bar */}
                    <ReactionBar
                      reactions={mergedReactions[msg.id] || []}
                      onToggle={(emoji) => handleToggleReaction(msg.id, emoji)}
                      isOwn={isOwn}
                    />

                    {/* Timestamp */}
                    {msg.isLastInGroup && (
                      <p className={cn(
                        "text-[9px] text-muted-foreground/50 px-1 mt-1",
                        isOwn && "text-right"
                      )}>
                        {formatTime(msg.timestamp)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* ─── Typing indicator ─── */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-2 pt-3"
          >
            <div className="flex -space-x-1.5">
              {typingUsers.slice(0, 3).map((name) => (
                <div key={name} className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-bold text-accent-foreground border-2 border-card">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <div className="flex gap-1 bg-muted/50 px-3 py-2 rounded-2xl rounded-bl-md border border-border/30">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/40"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground/60">
              {typingUsers.length === 1
                ? t('chat.isTyping', { name: typingUsers[0] })
                : t('chat.peopleTyping', { count: typingUsers.length })}
            </span>
          </motion.div>
        )}
      </div>

      {/* ─── Scroll to bottom ─── */}
      <AnimatePresence>
        {!isAtBottom && messages.length > 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="flex justify-center -mt-10 relative z-10 pb-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToBottom}
              className="h-7 rounded-full text-[10px] gap-1 shadow-lg bg-card/95 backdrop-blur-sm border-border/60 hover:border-primary/40"
            >
              <ChevronDown className="h-3 w-3" /> {t('chat.newMessages')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Input ─── */}
      <div className="border-t border-border/60 p-3 shrink-0 bg-gradient-to-t from-muted/20 to-transparent">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          {currentUserAvatarUrl && (
            <img src={currentUserAvatarUrl} alt="" className="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-border/40" />
          )}
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={isOnline
                ? t('chat.placeholder')
                : t('chat.offlinePlaceholder', { defaultValue: 'You are offline' })
              }
              maxLength={2000}
              className={cn(
                "h-10 text-[13px] rounded-xl pr-2",
                "bg-muted/30 border-border/50",
                "focus:bg-background focus:border-primary/40 focus:ring-primary/20",
                "transition-all duration-200",
                !isOnline && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isOnline}
            />
          </div>

          {/* Voice controls */}
          {voiceActive && voiceStatus === 'connected' && (
            <Button
              type="button" size="icon" variant="ghost"
              className="h-10 w-10 rounded-xl hover:bg-muted/50"
              onClick={onToggleMute}
              title={isMuted ? t('chat.unmute', { defaultValue: 'Unmute' }) : t('chat.mute', { defaultValue: 'Mute' })}
            >
              {isMuted
                ? <MicOff className="h-4 w-4 text-destructive" />
                : <Mic className="h-4 w-4 text-success" />
              }
            </Button>
          )}

          {onStartVoice && onStopVoice && (
            <Button
              type="button" size="icon"
              variant={voiceActive ? 'destructive' : 'outline'}
              className="h-10 w-10 rounded-xl shrink-0"
              onClick={handleToggleVoice}
              title={voiceActive ? t('chat.stopVoice', { defaultValue: 'Leave voice' }) : t('chat.startVoice', { defaultValue: 'Join voice' })}
            >
              {voiceActive ? <PhoneOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Button
            type="submit" size="icon"
            disabled={!input.trim() || !isOnline}
            className={cn(
              "h-10 w-10 rounded-xl shrink-0",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30",
              "disabled:opacity-30 disabled:shadow-none",
              "transition-all duration-200"
            )}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
});
