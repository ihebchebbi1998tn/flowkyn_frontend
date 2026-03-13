import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, Heart, Star, ThumbsUp, MessageCircle, Award,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const REACTION_ICONS: Record<string, typeof Heart> = {
  heart: Heart,
  star: Star,
  thumbsUp: ThumbsUp,
  award: Award,
};

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
    content: string;
    timestamp: string;
    reactions: { type: string; count: number; reacted: boolean }[];
  }[];
  canPost: boolean;
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
  onPost,
  onToggleReaction,
}: WinsOfTheWeekBoardProps) {
  const { t } = useTranslation();
  const displayPrompt = prompt || t('gamePlay.winsOfWeek.defaultPrompt', 'Share your win from this week — work or personal, big or small!');
  const [newPost, setNewPost] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyFor, setShowReplyFor] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    await onPost(newPost.trim());
    setNewPost('');
  };

  const toggleReaction = (postId: string, reactionType: string) => {
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
      await onPost(`@${authorName}: ${text}`);
      setReplyInputs(prev => ({ ...prev, [postId]: '' }));
      setShowReplyFor(null);
    } finally {
      setSubmittingReply(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Prompt card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-warning/60 to-warning" />
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 shrink-0">
              <Star className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.winsOfWeek.thisWeeksPrompt')}</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{displayPrompt}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {t('gamePlay.winsOfWeek.contributions', { count: posts.length })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('gamePlay.winsOfWeek.ongoing')}</span>
          </div>
        </div>
      </div>

      {/* New post input */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0 mt-0.5">
            {currentUserAvatarUrl ? <img src={currentUserAvatarUrl} alt={currentUserName} className="h-full w-full object-cover" /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">{currentUserAvatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder={t('gamePlay.winsOfWeek.shareYourWin')}
              rows={2}
              className="text-[13px] resize-none border-0 bg-muted/30 focus-visible:ring-1"
            />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={!newPost.trim() || !canPost} className="h-9 px-5 text-[12px] gap-2">
                <Send className="h-3.5 w-3.5" /> {t('gamePlay.winsOfWeek.share')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts feed */}
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
            <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-foreground">No wins shared yet</p>
            <p className="text-[12px] text-muted-foreground mt-1">Be the first to share your win of the week!</p>
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
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="p-4">
                {/* Author */}
                <div className="flex items-center gap-2.5 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">{post.authorAvatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{post.authorName}</p>
                    <p className="text-[10px] text-muted-foreground">{post.timestamp}</p>
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all',
                          r.reacted ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                        )}
                      >
                        <Icon className={cn('h-3 w-3', r.reacted && 'fill-current')} />
                        {r.count}
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
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
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
                      <MessageCircle className="h-3 w-3" /> {t('gamePlay.winsOfWeek.reply')}
                    </button>
                  )}
                </div>

                {/* Reply input (persists reply as a new post on the server) */}
                {showReplyFor === post.id && (
                  <div className="mt-3 pl-[42px] flex items-center gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                      {currentUserAvatarUrl ? <img src={currentUserAvatarUrl} alt={currentUserName} className="h-full w-full object-cover" /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-semibold">{currentUserAvatar}</AvatarFallback>
                    </Avatar>
                    <input
                      type="text"
                      value={replyInputs[post.id] || ''}
                      onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleReply(post.id, post.authorName); }}
                      placeholder={t('gamePlay.winsOfWeek.writeReply')}
                      className="flex-1 h-8 px-3 text-[12px] rounded-lg bg-muted/50 border-0 outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleReply(post.id, post.authorName)}
                      disabled={!replyInputs[post.id]?.trim() || submittingReply === post.id}
                      className="h-8 px-3 text-[11px]"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
