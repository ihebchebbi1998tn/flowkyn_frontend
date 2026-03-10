import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, SmilePlus, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChatMessage {
  id: string;
  userId: string;
  participantId: string;
  senderName: string;
  senderAvatar: string;
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
}

export function EventChat({
  eventId, messages, onSendMessage, onTyping, typingUsers = [], className, currentUserId,
}: EventChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isAtBottom]);

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
    if (!trimmed) return;
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

  const groupedMessages = messages.reduce<(ChatMessage & { showAvatar: boolean })[]>((acc, msg, i) => {
    const prev = i > 0 ? messages[i - 1] : null;
    const showAvatar = !prev || prev.userId !== msg.userId;
    acc.push({ ...msg, showAvatar });
    return acc;
  }, []);

  return (
    <div className={cn("flex flex-col rounded-2xl border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h3 className="text-[13px] font-bold text-foreground">{t('chat.title')}</h3>
        </div>
        <Badge variant="outline" className="text-[9px]">
          {messages.length} {t('chat.messages')}
        </Badge>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[200px] max-h-[400px] scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[13px] font-medium text-muted-foreground">{t('chat.noMessages')}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{t('chat.beFirst')}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {groupedMessages.map((msg) => {
              const isOwn = msg.isOwn || msg.userId === currentUserId;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                  <div className="w-7 shrink-0">
                    {msg.showAvatar ? (
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className={cn("text-[9px] font-bold", isOwn ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground")}>
                          {msg.senderAvatar}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                  </div>
                  <div className={cn("max-w-[75%] min-w-0", isOwn && "items-end")}>
                    {msg.showAvatar && (
                      <p className={cn("text-[10px] font-semibold mb-0.5 px-1", isOwn ? "text-right text-primary" : "text-muted-foreground")}>
                        {msg.senderName}
                      </p>
                    )}
                    <div className={cn("rounded-2xl px-3 py-2 text-[13px] leading-relaxed break-words",
                      isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/60 text-foreground rounded-tl-sm")}>
                      {msg.message}
                    </div>
                    <p className={cn("text-[9px] text-muted-foreground/50 mt-0.5 px-1", isOwn && "text-right")}>{formatTime(msg.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {typingUsers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-1 pt-1">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                  animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground/50">
              {typingUsers.length === 1 ? t('chat.isTyping', { name: typingUsers[0] }) : t('chat.peopleTyping', { count: typingUsers.length })}
            </span>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {!isAtBottom && messages.length > 5 && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="flex justify-center -mt-8 relative z-10">
            <Button variant="outline" size="sm" onClick={scrollToBottom} className="h-7 rounded-full text-[10px] gap-1 shadow-md bg-card">
              <ChevronDown className="h-3 w-3" /> {t('chat.newMessages')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-border p-2.5">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <Input ref={inputRef} value={input} onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('chat.placeholder')} maxLength={2000}
            className="h-9 text-[13px] rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors" />
          <Button type="submit" size="icon" disabled={!input.trim()}
            className="h-9 w-9 rounded-xl shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
