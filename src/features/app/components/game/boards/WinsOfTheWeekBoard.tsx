import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, Heart, Star, ThumbsUp, MessageCircle, Award,
  Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  reactions: { type: string; count: number; reacted: boolean }[];
  replies: { authorName: string; authorAvatar: string; content: string; timestamp: string }[];
}

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
}

export function WinsOfTheWeekBoard({ prompt, currentUserId, currentUserName, currentUserAvatar, currentUserAvatarUrl }: WinsOfTheWeekBoardProps) {
  const { t } = useTranslation();
  const displayPrompt = prompt || t('gamePlay.winsOfWeek.defaultPrompt', 'Share your win from this week — work or personal, big or small!');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyFor, setShowReplyFor] = useState<string | null>(null);

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: String(Date.now()),
      authorName: currentUserName, authorAvatar: currentUserAvatar,
      content: newPost.trim(), timestamp: 'Just now',
      reactions: [], replies: [],
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const toggleReaction = (postId: string, reactionType: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const existing = p.reactions.find(r => r.type === reactionType);
      if (existing) {
        return { ...p, reactions: p.reactions.map(r =>
          r.type === reactionType ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted } : r
        )};
      }
      return { ...p, reactions: [...p.reactions, { type: reactionType, count: 1, reacted: true }] };
    }));
  };

  const handleReply = (postId: string) => {
    const text = replyInputs[postId]?.trim();
    if (!text) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, replies: [...p.replies, { authorName: currentUserName, authorAvatar: currentUserAvatar, content: text, timestamp: 'Just now' }] };
    }));
    setReplyInputs(prev => ({ ...prev, [postId]: '' }));
    setShowReplyFor(null);
    setExpandedReplies(prev => new Set(prev).add(postId));
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
            <Textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={t('gamePlay.winsOfWeek.shareYourWin')} rows={2}
              className="text-[13px] resize-none border-0 bg-muted/30 focus-visible:ring-1" />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={!newPost.trim()} className="h-9 px-5 text-[12px] gap-2">
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
          {posts.map(post => {
            const repliesExpanded = expandedReplies.has(post.id);
            return (
              <motion.div 
                layout 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
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

                {/* Reactions */}
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
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all",
                          r.reacted ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                        )}>
                        <Icon className={cn("h-3 w-3", r.reacted && 'fill-current')} />
                        {r.count}
                      </motion.button>
                    );
                  })}
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
                          className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                          <Icon className="h-3 w-3" />
                        </motion.button>
                      ))}
                  </div>
                  <div className="flex-1" />
                  <button onClick={() => setShowReplyFor(showReplyFor === post.id ? null : post.id)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-3 w-3" /> {t('gamePlay.winsOfWeek.reply')}
                  </button>
                </div>

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div className="mt-3 pl-[42px]">
                    <button onClick={() => {
                      const next = new Set(expandedReplies);
                      repliesExpanded ? next.delete(post.id) : next.add(post.id);
                      setExpandedReplies(next);
                    }} className="flex items-center gap-1 text-[11px] text-primary font-medium mb-2">
                      {repliesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {post.replies.length === 1 ? t('gamePlay.winsOfWeek.replyCount', { count: post.replies.length }) : t('gamePlay.winsOfWeek.repliesCount', { count: post.replies.length })}
                    </button>
                    {repliesExpanded && (
                      <div className="space-y-2 border-l-2 border-border pl-3">
                        {post.replies.map((reply, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                              <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-semibold">{reply.authorAvatar}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-medium text-foreground">{reply.authorName}</span>
                                <span className="text-[10px] text-muted-foreground">{reply.timestamp}</span>
                              </div>
                              <p className="text-[12px] text-foreground/80 leading-relaxed">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reply input */}
                {showReplyFor === post.id && (
                  <div className="mt-3 pl-[42px] flex items-center gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                       {currentUserAvatarUrl ? <img src={currentUserAvatarUrl} alt={currentUserName} className="h-full w-full object-cover" /> : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-semibold">{currentUserAvatar}</AvatarFallback>
                    </Avatar>
                    <input type="text" value={replyInputs[post.id] || ''}
                      onChange={e => setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleReply(post.id)}
                      placeholder={t('gamePlay.winsOfWeek.writeReply')}
                      className="flex-1 h-8 px-3 text-[12px] rounded-lg bg-muted/50 border-0 outline-none focus:ring-1 focus:ring-ring" />
                    <Button size="sm" onClick={() => handleReply(post.id)} disabled={!replyInputs[post.id]?.trim()} className="h-8 px-3 text-[11px]">
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}
