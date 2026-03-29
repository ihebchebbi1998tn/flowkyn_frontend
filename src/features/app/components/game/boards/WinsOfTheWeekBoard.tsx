import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, Heart, Star, ThumbsUp, MessageCircle, Award,
  Clock, Calendar, AlertCircle, Loader2, Trophy,
  Sparkles, PartyPopper, TrendingUp,
} from 'lucide-react';
import { GameActionButton } from '../shared';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useWinsFeed } from '@/hooks/useWinsFeed';
import { HowItWorksModal } from '../shared/HowItWorksModal';
import { CategoryPicker } from '@/features/app/components/wins';

const REACTION_ICONS: Record<string, typeof Heart> = {
  heart: Heart,
  star: Star,
  thumbsUp: ThumbsUp,
  award: Award,
};

const REACTION_COLORS: Record<string, string> = {
  heart: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  star: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  thumbsUp: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
  award: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
};

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

  return new Intl.DateTimeFormat(locale, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(postDate);
}

function formatEndTime(args: {
  endsAt: string; isClosed: boolean;
  t: (key: string, opts?: Record<string, unknown>) => unknown; locale: string;
}): string {
  const { endsAt, isClosed, t, locale } = args;
  const now = new Date();
  const endDate = new Date(endsAt);
  const diff = endDate.getTime() - now.getTime();

  if (isClosed) {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(endDate);
  }
  if (diff < 0) return String(t('gamePlay.winsOfWeek.endTime.ended', { defaultValue: 'Ended' }));

  const minutes = Math.floor((diff / 1000) % 60);
  const hours = Math.floor((diff / 1000 / 60) % 60);
  const totalHours = Math.floor(diff / 3600000);

  if (totalHours === 0) return String(t('gamePlay.winsOfWeek.endTime.minutesLeft', { defaultValue: '{{count}}m left', count: minutes }));
  if (totalHours < 24) return String(t('gamePlay.winsOfWeek.endTime.hoursMinutesLeft', { defaultValue: '{{hours}}h {{minutes}}m left', hours, minutes }));

  const days = Math.floor(diff / 86400000);
  return String(t('gamePlay.winsOfWeek.endTime.daysLeft', { defaultValue: '{{count}}d left', count: days }));
}

export interface WinsOfTheWeekBoardProps {
  prompt?: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserAvatarUrl?: string | null;
  organizationId: string;
  posts: {
    id: string;
    authorName: string;
    authorAvatar: string;
    authorAvatarUrl?: string | null;
    content: string;
    timestamp: string;
    category?: string;
    tags?: string[];
    parentPostId?: string | null;
    reactions: { type: string; count: number; reacted: boolean }[];
  }[];
  canPost: boolean;
  canReact?: boolean;
  endsAt?: string;
  postingClosed?: boolean;
  onPost: (content: string, category?: string, tags?: string[], parentPostId?: string) => Promise<void> | void;
  onToggleReaction: (postId: string, reactionType: string) => Promise<void> | void;
}

export function WinsOfTheWeekBoard({
  prompt,
  currentUserId: _currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserAvatarUrl,
  organizationId,
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
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyFor, setShowReplyFor] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [liveEndTime, setLiveEndTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [characterWarningLevel, setCharacterWarningLevel] = useState<'normal' | 'caution' | 'warning'>('normal');
  const feedRef = useRef<HTMLDivElement>(null);

  const { newPostsCount, markPostsAsSeen, hasMilestone, currentMilestone } = useWinsFeed(posts.length);

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
    setPostError(null);
    try {
      await onPost(newPost.trim(), selectedCategory[0] || undefined, []);
      setNewPost('');
      setSelectedCategory([]);
      setCharacterWarningLevel('normal');
    } catch (error) {
      console.error('[WinsOfTheWeekBoard] handlePost error', error);
      setPostError(t('gamePlay.winsOfWeek.postFailed', { defaultValue: 'Failed to share your win. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewPost(value);
    const percentage = (value.length / 5000) * 100;
    if (percentage > 90) setCharacterWarningLevel('warning');
    else if (percentage > 75) setCharacterWarningLevel('caution');
    else setCharacterWarningLevel('normal');
  };

  const toggleReaction = (postId: string, reactionType: string) => {
    if (!canReact) return;
    onToggleReaction(postId, reactionType);
  };

  const handleReply = async (postId: string, _authorName: string) => {
    const text = replyInputs[postId]?.trim();
    if (!text || !canPost) return;
    setSubmittingReply(postId);
    try {
      await onPost(text, undefined, undefined, postId);
      setReplyInputs(prev => ({ ...prev, [postId]: '' }));
      setShowReplyFor(null);
    } finally {
      setSubmittingReply(null);
    }
  };

  const topLevelPosts = posts.filter(p => !p.parentPostId);

  return (
    <div className="space-y-5">
      <HowItWorksModal open={howOpen} onOpenChange={setHowOpen} baseKey="gameHowItWorks.winsOfWeek" />

      {/* ── Hero Prompt Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl border border-border/60 bg-card overflow-hidden"
      >
        {/* Top gradient strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-primary to-rose-400" />

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/[0.04] blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-20 bg-primary/[0.03] blur-3xl rounded-full pointer-events-none" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Trophy icon */}
            <motion.div
              className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/20 shrink-0"
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Trophy className="h-7 w-7 text-amber-500" strokeWidth={1.5} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {t('gamePlay.winsOfWeek.thisWeeksPrompt', { defaultValue: "This week's prompt" })}
                </h2>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{displayPrompt}</p>

              {/* Status pills */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/40 text-muted-foreground border border-border/50">
                  <MessageCircle className="h-3 w-3" />
                  {t('gamePlay.winsOfWeek.contributions', { defaultValue: '{{count}} contributions', count: posts.length })}
                </span>

                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border',
                  postingClosed
                    ? 'bg-muted/40 text-muted-foreground border-border/50'
                    : 'bg-success/10 text-success border-success/20'
                )}>
                  {postingClosed ? (
                    <Clock className="h-3 w-3" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  )}
                  {postingClosed
                    ? t('gamePlay.winsOfWeek.closed', { defaultValue: 'Closed' })
                    : t('gamePlay.winsOfWeek.ongoing', { defaultValue: 'Ongoing' })
                  }
                </span>

                {endsAt && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/40 text-muted-foreground border border-border/50">
                    <Calendar className="h-3 w-3" />
                    {liveEndTime || formatEndTime({ endsAt, isClosed: postingClosed, t, locale: i18n.language })}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setHowOpen(true)}
              className="shrink-0 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/50"
            >
              {t('gameHowItWorks.common.title', { defaultValue: 'How this works' })}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Compose Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
      >
        {postingClosed && (
          <div className="mb-4 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-xs text-muted-foreground flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <div>
              <span className="font-semibold text-foreground block text-[13px]">
                {t('gamePlay.winsOfWeek.postingClosedTitle', { defaultValue: 'Posting is closed' })}
              </span>
              <span className="block mt-0.5 text-[12px]">
                {t('gamePlay.winsOfWeek.postingClosedBody', { defaultValue: 'This activity has ended. You can still read and react is disabled.' })}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0 mt-0.5 ring-2 ring-primary/10">
            {currentUserAvatarUrl ? <AvatarImage src={currentUserAvatarUrl} alt={currentUserName} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{currentUserAvatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              value={newPost}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={canPost
                ? t('gamePlay.winsOfWeek.shareYourWin', { defaultValue: 'Share your win…' })
                : t('gamePlay.winsOfWeek.readOnlyPlaceholder', { defaultValue: 'Posting is closed for this activity.' })
              }
              rows={3}
              className="text-sm resize-none border-border/50 bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl placeholder:text-muted-foreground/60"
              disabled={!canPost || isSubmitting}
            />

            {canPost && (
              <div className="rounded-xl bg-muted/15 p-3 border border-border/40">
                <CategoryPicker
                  organizationId={organizationId}
                  selectedCategories={selectedCategory}
                  onSelectionChange={setSelectedCategory}
                  maxSelections={1}
                  disabled={isSubmitting}
                  size="sm"
                />
              </div>
            )}

            <div className="flex justify-between items-center">
              <motion.span
                className={cn(
                  'text-[11px] transition-all',
                  characterWarningLevel === 'warning' && 'text-destructive font-bold',
                  characterWarningLevel === 'caution' && 'text-warning font-medium',
                  characterWarningLevel === 'normal' && 'text-muted-foreground/60'
                )}
                animate={characterWarningLevel === 'warning' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {newPost.length > 0 && `${newPost.length} / 5,000`}
              </motion.span>

              <motion.div animate={isSubmitting ? { opacity: 0.7 } : { opacity: 1 }}>
                <GameActionButton
                  onClick={handlePost}
                  disabled={!newPost.trim() || !canPost || isSubmitting}
                  size="md"
                  className="text-[12px] rounded-xl px-5"
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

            {postError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {postError}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Feed ── */}
      <div className="space-y-3 relative" ref={feedRef}>
        {/* New posts banner */}
        <AnimatePresence>
          {newPostsCount > 0 && (
            <motion.button
              initial={{ y: -40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => {
                markPostsAsSeen();
                feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="sticky top-2 z-20 w-full py-2.5 px-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-2.5 hover:shadow-lg hover:shadow-primary/20 transition-shadow"
            >
              <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <TrendingUp className="h-4 w-4" />
              </motion.div>
              {t('gamePlay.winsOfWeek.newPosts', { defaultValue: '{{count}} new post(s)', count: newPostsCount })}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Milestone celebration */}
        <AnimatePresence>
          {hasMilestone && currentMilestone && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full py-4 px-5 bg-gradient-to-r from-amber-500/10 via-primary/10 to-rose-500/10 border border-amber-500/15 rounded-2xl flex items-center justify-center gap-3"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8 }}>
                <PartyPopper className="h-6 w-6 text-amber-500" />
              </motion.div>
              <span className="text-sm font-semibold text-foreground">
                {t('gamePlay.winsOfWeek.milestone', { defaultValue: '🎉 Incredible! {{count}} wins celebrated this week!', count: currentMilestone })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {topLevelPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-dashed border-border/60 p-10 text-center bg-gradient-to-b from-muted/10 to-muted/5"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/15 to-primary/10 border border-amber-400/20 mb-4"
            >
              <Trophy className="h-8 w-8 text-amber-500/60" strokeWidth={1.5} />
            </motion.div>
            <p className="text-base font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t('gamePlay.winsOfWeek.emptyTitle', { defaultValue: 'No wins shared yet' })}
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
              {t('gamePlay.winsOfWeek.emptySubtitle', { defaultValue: 'Be the first to share your win of the week!' })}
            </p>
          </motion.div>
        )}

        {/* Posts */}
        <AnimatePresence>
          {topLevelPosts.map((post, postIndex) => {
            const replies = posts.filter(r => r.parentPostId === post.id);
            return (
              <div key={post.id} className="space-y-1.5">
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30, delay: postIndex * 0.03 }}
                  className="group/post rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-border/80 hover:shadow-sm transition-all duration-200"
                >
                  <div className="p-4 sm:p-5">
                    {/* Author row */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-muted/50 group-hover/post:ring-primary/15 transition-all">
                        {post.authorAvatarUrl ? <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{post.authorAvatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{post.authorName}</p>
                        <time
                          className="text-[11px] text-muted-foreground/70"
                          dateTime={post.timestamp}
                          title={new Date(post.timestamp).toLocaleString()}
                        >
                          {formatTimeAgo({ timestamp: post.timestamp, t, locale: i18n.language })}
                        </time>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pl-12 space-y-3">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

                      {/* Category + Tags */}
                      {(post.category || (post.tags && post.tags.length > 0)) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.category && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/8 text-primary border border-primary/15">
                              {post.category}
                            </span>
                          )}
                          {post.tags?.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border/40">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Reactions + Reply */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {post.reactions.map(r => {
                          const Icon = REACTION_ICONS[r.type] || Heart;
                          const activeColor = REACTION_COLORS[r.type] || 'text-primary bg-primary/10 border-primary/20';
                          return (
                            <motion.button
                              key={r.type}
                              onClick={() => toggleReaction(post.id, r.type)}
                              whileHover={{ scale: 1.06, y: -1 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border',
                                r.reacted
                                  ? activeColor
                                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 border-transparent'
                              )}
                              title={t('gamePlay.winsOfWeek.reactionCount', { defaultValue: '{{count}} reaction(s)', count: r.count })}
                            >
                              <motion.div
                                animate={r.reacted ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                <Icon className={cn('h-3 w-3', r.reacted && 'fill-current')} />
                              </motion.div>
                              <span>{r.count}</span>
                            </motion.button>
                          );
                        })}

                        {/* Quick add reactions */}
                        {Object.entries(REACTION_ICONS)
                          .filter(([type]) => !post.reactions.some(r => r.type === type))
                          .slice(0, 2)
                          .map(([type, Icon]) => (
                            <motion.button
                              key={type}
                              onClick={() => toggleReaction(post.id, type)}
                              whileHover={{ scale: 1.2, rotate: 8 }}
                              whileTap={{ scale: 0.85 }}
                              className="p-1.5 rounded-full text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/40 transition-all"
                              title={t('gamePlay.winsOfWeek.addReaction', { defaultValue: 'Add {{type}} reaction', type })}
                            >
                              <Icon className="h-3 w-3" />
                            </motion.button>
                          ))}

                        <div className="flex-1" />

                        {canPost && (
                          <button
                            onClick={() => setShowReplyFor(showReplyFor === post.id ? null : post.id)}
                            className={cn(
                              'flex items-center gap-1.5 text-[11px] font-medium transition-colors rounded-full px-2.5 py-1',
                              showReplyFor === post.id
                                ? 'text-primary bg-primary/8'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            )}
                          >
                            <MessageCircle className="h-3 w-3" />
                            {replies.length > 0
                              ? t('gamePlay.winsOfWeek.replyCount', { defaultValue: '{{count}} replies', count: replies.length })
                              : t('gamePlay.winsOfWeek.reply', { defaultValue: 'Reply' })
                            }
                          </button>
                        )}
                      </div>

                      {/* Reply input */}
                      <AnimatePresence>
                        {showReplyFor === post.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="flex items-center gap-2 overflow-hidden"
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              {currentUserAvatarUrl ? <AvatarImage src={currentUserAvatarUrl} alt={currentUserName} /> : null}
                              <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-bold">{currentUserAvatar}</AvatarFallback>
                            </Avatar>
                            <input
                              type="text"
                              value={replyInputs[post.id] || ''}
                              onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleReply(post.id, post.authorName); }}
                              placeholder={t('gamePlay.winsOfWeek.writeReply', { defaultValue: 'Write a reply…' })}
                              className="flex-1 h-8 px-3 text-[12px] rounded-full bg-muted/40 border border-border/40 outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
                              autoFocus
                              disabled={submittingReply === post.id}
                            />
                            <GameActionButton
                              size="sm"
                              onClick={() => handleReply(post.id, post.authorName)}
                              disabled={!replyInputs[post.id]?.trim() || submittingReply === post.id}
                              className="text-[11px] rounded-full h-8 w-8 p-0"
                            >
                              {submittingReply === post.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                            </GameActionButton>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* Threaded replies */}
                {replies.length > 0 && (
                  <div className="pl-10 sm:pl-12 space-y-1.5">
                    {replies.map(reply => (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="rounded-xl border border-border/40 bg-muted/15 p-3 hover:bg-muted/25 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6 shrink-0">
                            {reply.authorAvatarUrl ? <AvatarImage src={reply.authorAvatarUrl} alt={reply.authorName} /> : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-bold">{reply.authorAvatar}</AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] font-semibold text-foreground">{reply.authorName}</span>
                          <time className="text-[10px] text-muted-foreground/60" dateTime={reply.timestamp}>
                            {formatTimeAgo({ timestamp: reply.timestamp, t, locale: i18n.language })}
                          </time>
                        </div>
                        <p className="text-[12px] text-foreground/90 leading-relaxed pl-8">{reply.content}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
