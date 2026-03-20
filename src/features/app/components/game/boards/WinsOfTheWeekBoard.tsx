import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, Heart, Star, ThumbsUp, MessageCircle, Award,
  Clock, Calendar, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import { GameActionButton } from '../shared';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useWinsFeed } from '@/hooks/useWinsFeed';
import { HowItWorksModal } from '../shared/HowItWorksModal';

const REACTION_ICONS: Record<string, typeof Heart> = {
  heart: Heart,
  star: Star,
  thumbsUp: ThumbsUp,
  award: Award,
};

/**
 * Format timestamp into a human-readable, localized string
 * Examples: "Just now", "2 minutes ago", "Yesterday", "Mar 18, 2026"
 */
function formatTimeAgo(args: {
  timestamp: string | Date;
  t: (key: string, opts?: Record<string, unknown>) => unknown;
  locale: string;
}): string {
  const { timestamp, t, locale } = args;
  const now = new Date();
  const postDate = new Date(timestamp);
  const diff = now.getTime() - postDate.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return String(t('gamePlay.winsOfWeek.timeAgo.justNow', { defaultValue: 'Just now' }));
  if (minutes < 60) return String(t('gamePlay.winsOfWeek.timeAgo.minutes', { defaultValue: '{{count}}m ago', count: minutes }));
  if (hours < 24) return String(t('gamePlay.winsOfWeek.timeAgo.hours', { defaultValue: '{{count}}h ago', count: hours }));
  if (days === 1) return String(t('gamePlay.winsOfWeek.timeAgo.yesterday', { defaultValue: 'Yesterday' }));
  if (days < 7) return String(t('gamePlay.winsOfWeek.timeAgo.days', { defaultValue: '{{count}}d ago', count: days }));

  // For older posts, show formatted date (e.g., "Mar 18, 2026 at 2:30 PM")
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(postDate);
}

/**
 * Format absolute end time for display
 * Examples: "Ends in 2h 45m", "Ends today at 5:00 PM", "Ended Mar 18"
 */
function formatEndTime(args: {
  endsAt: string;
  isClosed: boolean;
  t: (key: string, opts?: Record<string, unknown>) => unknown;
  locale: string;
}): string {
  const { endsAt, isClosed, t, locale } = args;
  const now = new Date();
  const endDate = new Date(endsAt);
  const diff = endDate.getTime() - now.getTime();

  if (isClosed) {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(endDate);
  }

  if (diff < 0) return String(t('gamePlay.winsOfWeek.endTime.ended', { defaultValue: 'Ended' }));

  const minutes = Math.floor((diff / 1000) % 60);
  const hours = Math.floor((diff / 1000 / 60) % 60);
  const totalHours = Math.floor(diff / 3600000);

  if (totalHours === 0) {
    return String(t('gamePlay.winsOfWeek.endTime.minutesLeft', { defaultValue: '{{count}}m left', count: minutes }));
  }
  if (totalHours < 24) {
    return String(t('gamePlay.winsOfWeek.endTime.hoursMinutesLeft', {
      defaultValue: '{{hours}}h {{minutes}}m left',
      hours,
      minutes,
    }));
  }

  const days = Math.floor(diff / 86400000);
  return String(t('gamePlay.winsOfWeek.endTime.daysLeft', { defaultValue: '{{count}}d left', count: days }));
}

export interface WinsOfTheWeekBoardProps {
  prompt?: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserAvatarUrl?: string | null;
  posts: {
    id: string;
    authorName: string;
    authorAvatar: string;
    authorAvatarUrl?: string | null;
    content: string;
    timestamp: string;
    reactions: { type: string; count: number; reacted: boolean }[];
  }[];
  canPost: boolean;
  canReact?: boolean;
  endsAt?: string;
  postingClosed?: boolean;
  onPost: (content: string) => Promise<void> | void;
  onToggleReaction: (postId: string, reactionType: string) => Promise<void> | void;
}

export function WinsOfTheWeekBoard({
  prompt,
  currentUserId: _currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserAvatarUrl,
  posts,
  canPost,
  canReact = true,
  endsAt,
  postingClosed = false,
  onPost,
  onToggleReaction,
}: WinsOfTheWeekBoardProps) {
  const { t, i18n } = useTranslation();
  const [howOpen, setHowOpen] = useState(false);
  const displayPrompt = prompt || t('gamePlay.winsOfWeek.defaultPrompt', { defaultValue: 'Share your win from this week — work or personal, big or small!' });
  const [newPost, setNewPost] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyFor, setShowReplyFor] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [liveEndTime, setLiveEndTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [characterWarningLevel, setCharacterWarningLevel] = useState<'normal' | 'caution' | 'warning'>('normal');
  const feedRef = useRef<HTMLDivElement>(null);

  // Use feed management hook
  const { newPostsCount, markPostsAsSeen, hasMilestone, currentMilestone } = useWinsFeed(posts.length);

  // Update end time display every minute
  useEffect(() => {
    if (!endsAt) return;
    const updateEndTime = () => {
      setLiveEndTime(formatEndTime({ endsAt, isClosed: postingClosed, t, locale: i18n.language }));
    };
    updateEndTime();
    const interval = setInterval(updateEndTime, 60000);
    return () => clearInterval(interval);
  }, [endsAt, postingClosed, i18n.language, t]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsSubmitting(true);
    try {
      console.log('[WinsOfTheWeekBoard] handlePost', { 
        length: newPost.trim().length,
        timestamp: new Date().toISOString(),
      });
      await onPost(newPost.trim());
      setNewPost('');
      setCharacterWarningLevel('normal');
    } catch (error) {
      console.error('[WinsOfTheWeekBoard] handlePost error', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes and update character warning level
   */
  const handleInputChange = (value: string) => {
    setNewPost(value);
    const percentage = (value.length / 5000) * 100;
    if (percentage > 90) {
      setCharacterWarningLevel('warning');
    } else if (percentage > 75) {
      setCharacterWarningLevel('caution');
    } else {
      setCharacterWarningLevel('normal');
    }
  };

  const toggleReaction = (postId: string, reactionType: string) => {
    console.log('[WinsOfTheWeekBoard] toggleReaction', { 
      postId, 
      reactionType,
      timestamp: new Date().toISOString(),
    });
    if (!canReact) return;
    onToggleReaction(postId, reactionType);
  };

  /**
   * Replies are stored as regular posts prefixed with @authorName.
   * This keeps all content persistent on the server without a separate replies table.
   */
  const handleReply = async (postId: string, authorName: string) => {
    const text = replyInputs[postId]?.trim();
    if (!text || !canPost) return;
    setSubmittingReply(postId);
    try {
      console.log('[WinsOfTheWeekBoard] handleReply', {
        postId,
        authorName,
        length: text.length,
        timestamp: new Date().toISOString(),
      });
      await onPost(`@${authorName}: ${text}`);
      setReplyInputs(prev => ({ ...prev, [postId]: '' }));
      setShowReplyFor(null);
    } finally {
      setSubmittingReply(null);
    }
  };

  return (
    <div className="space-y-4">
      <HowItWorksModal open={howOpen} onOpenChange={setHowOpen} baseKey="gameHowItWorks.winsOfWeek" />
      {/* Prompt card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-warning/60 to-warning" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 shrink-0">
              <Star className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.winsOfWeek.thisWeeksPrompt', { defaultValue: "This week's prompt" })}</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{displayPrompt}</p>
            </div>
            <GameActionButton
              variant="ghost"
              size="sm"
              className="text-[11px] shrink-0"
              onClick={() => setHowOpen(true)}
            >
              {t('gameHowItWorks.common.title', { defaultValue: 'How this works' })}
            </GameActionButton>
          </div>
          
          {/* Status bar with detailed info */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            {/* Contribution count */}
            <span className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-md">
              <MessageCircle className="h-3 w-3" /> 
              {t('gamePlay.winsOfWeek.contributions', { defaultValue: '{{count}} contributions', count: posts.length })}
            </span>

            {/* Status indicator */}
            <span className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md font-medium',
              postingClosed
                ? 'bg-muted/30 text-muted-foreground'
                : 'bg-success/10 text-success'
            )}>
              <Clock className="h-3 w-3" /> 
              {postingClosed 
                ? t('gamePlay.winsOfWeek.closed', { defaultValue: 'Closed' }) 
                : t('gamePlay.winsOfWeek.ongoing', { defaultValue: 'Ongoing' })
              }
            </span>

            {/* Time indicator */}
            {endsAt && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30">
                <Calendar className="h-3 w-3" />
                {liveEndTime || formatEndTime({ endsAt, isClosed: postingClosed, t, locale: i18n.language })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* New post input */}
      <div className="rounded-xl border border-border bg-card p-4">
        {postingClosed && (
          <div className="mb-3 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <div>
              <span className="font-medium text-foreground block">
                {t('gamePlay.winsOfWeek.postingClosedTitle', { defaultValue: 'Posting is closed' })}
              </span>
              <span className="block mt-0.5">
                {t('gamePlay.winsOfWeek.postingClosedBody', { defaultValue: 'This activity has ended. You can still read and react is disabled.' })}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0 mt-0.5">
            {currentUserAvatarUrl ? <img src={currentUserAvatarUrl} alt={currentUserName} className="h-full w-full object-cover" /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">{currentUserAvatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newPost}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={canPost ? t('gamePlay.winsOfWeek.shareYourWin', { defaultValue: 'Share your win…' }) : t('gamePlay.winsOfWeek.readOnlyPlaceholder', { defaultValue: 'Posting is closed for this activity.' })}
              rows={2}
              className="text-[13px] resize-none border-0 bg-muted/30 focus-visible:ring-1"
              disabled={!canPost || isSubmitting}
            />
            <div className="flex justify-end gap-2 items-center">
              <motion.span 
                className={cn(
                  'text-[10px] transition-all',
                  characterWarningLevel === 'warning' && 'text-red-500 font-bold',
                  characterWarningLevel === 'caution' && 'text-orange-500 font-medium',
                  characterWarningLevel === 'normal' && 'text-muted-foreground'
                )}
                animate={characterWarningLevel === 'warning' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {newPost.length > 0 && `${newPost.length} / 5000`}
              </motion.span>
              <motion.div
                animate={isSubmitting ? { opacity: 0.7 } : { opacity: 1 }}
              >
                <GameActionButton
                  onClick={handlePost}
                  disabled={!newPost.trim() || !canPost || isSubmitting}
                  size="md"
                  className="text-[12px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> 
                      {t('gamePlay.winsOfWeek.sharing', { defaultValue: 'Sharing…' })}
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> 
                      {t('gamePlay.winsOfWeek.share', { defaultValue: 'Share' })}
                    </>
                  )}
                </GameActionButton>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts feed */}
      <div className="space-y-3 relative" ref={feedRef}>
        {/* New posts indicator badge */}
        <AnimatePresence>
          {newPostsCount > 0 && (
            <motion.button
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => {
                markPostsAsSeen();
                feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="sticky top-0 z-20 w-full py-2.5 px-3 bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-colors"
            >
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ↓
              </motion.div>
              <span>
                {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Milestone celebration toast */}
        <AnimatePresence>
          {hasMilestone && currentMilestone && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg flex items-center justify-center gap-2 text-success font-medium text-sm"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.div>
              <span>
                🎉 Incredible! {currentMilestone} wins celebrated this week!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {posts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
            <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-foreground">
              {t('gamePlay.winsOfWeek.emptyTitle', { defaultValue: 'No wins shared yet' })}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              {t('gamePlay.winsOfWeek.emptySubtitle', { defaultValue: 'Be the first to share your win of the week!' })}
            </p>
          </div>
        )}
        <AnimatePresence>
          {posts.map(post => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              key={post.id}
              className="rounded-xl border border-border bg-card overflow-hidden hover:border-border/80 transition-colors"
            >
              <div className="p-4">
                {/* Author section with improved timestamp */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <Avatar className="h-8 w-8 shrink-0">
                      {post.authorAvatarUrl ? <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">{post.authorAvatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{post.authorName}</p>
                      <time className="text-[10px] text-muted-foreground" dateTime={post.timestamp} title={new Date(post.timestamp).toLocaleString()}>
                        {formatTimeAgo({ timestamp: post.timestamp, t, locale: i18n.language })}
                      </time>
                    </div>
                  </div>
                </div>

                <p className="text-[13px] text-foreground leading-relaxed mb-3 pl-[42px]">{post.content}</p>

                {/* Reactions row */}
                <div className="flex items-center gap-1.5 pl-[42px] flex-wrap">
                  {post.reactions.map(r => {
                    const Icon = REACTION_ICONS[r.type] || Heart;
                    return (
                      <motion.button
                        key={r.type}
                        onClick={() => toggleReaction(post.id, r.type)}
                        whileHover={{ scale: 1.08, y: -1 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
                          r.reacted ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                        )}
                        title={`${r.count} reaction${r.count > 1 ? 's' : ''}`}
                      >
                        <motion.div
                          animate={r.reacted ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          <Icon className={cn('h-3 w-3', r.reacted && 'fill-current')} />
                        </motion.div>
                        <motion.span
                          key={r.count}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.3 }}
                        >
                          {r.count}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                  {/* Add-reaction buttons for types not yet used */}
                  <div className="flex items-center gap-0.5">
                    {Object.entries(REACTION_ICONS)
                      .filter(([type]) => !post.reactions.some(r => r.type === type))
                      .slice(0, 2)
                      .map(([type, Icon]) => (
                        <motion.button
                          key={type}
                          onClick={() => toggleReaction(post.id, type)}
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                          title={`Add ${type} reaction`}
                        >
                          <Icon className="h-3 w-3" />
                        </motion.button>
                      ))}
                  </div>
                  <div className="flex-1" />
                  {canPost && (
                    <button
                      onClick={() => setShowReplyFor(showReplyFor === post.id ? null : post.id)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" /> {t('gamePlay.winsOfWeek.reply', { defaultValue: 'Reply' })}
                    </button>
                  )}
                </div>

                {/* Reply input (persists reply as a new post on the server) */}
                {showReplyFor === post.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="mt-3 pl-[42px] flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      {currentUserAvatarUrl ? <img src={currentUserAvatarUrl} alt={currentUserName} className="h-full w-full object-cover" /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-semibold">{currentUserAvatar}</AvatarFallback>
                    </Avatar>
                    <motion.input
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      type="text"
                      value={replyInputs[post.id] || ''}
                      onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleReply(post.id, post.authorName); }}
                      placeholder={t('gamePlay.winsOfWeek.writeReply', { defaultValue: 'Write a reply…' })}
                      className="flex-1 h-8 px-3 text-[12px] rounded-lg bg-muted/50 border-0 outline-none focus:ring-1 focus:ring-ring transition-all"
                      autoFocus
                      disabled={submittingReply === post.id}
                    />
                    <motion.div
                      animate={submittingReply === post.id ? { opacity: 0.7 } : { opacity: 1 }}
                    >
                      <GameActionButton
                        size="sm"
                        onClick={() => handleReply(post.id, post.authorName)}
                        disabled={!replyInputs[post.id]?.trim() || submittingReply === post.id}
                        className="text-[11px]"
                      >
                        {submittingReply === post.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </GameActionButton>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
