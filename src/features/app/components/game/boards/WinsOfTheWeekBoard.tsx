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

const MOCK_POSTS: Post[] = [
  {
    id: '1', authorName: 'Sarah Kim', authorAvatar: 'SK',
    content: 'Shipped the new onboarding flow this week! Three months of work finally live. The user feedback has been really positive so far.',
    timestamp: '2 hours ago',
    reactions: [
      { type: 'heart', count: 5, reacted: true },
      { type: 'thumbsUp', count: 3, reacted: false },
      { type: 'star', count: 2, reacted: false },
    ],
    replies: [
      { authorName: 'Alex Morgan', authorAvatar: 'AM', content: 'Amazing work Sarah! The new flow is so much smoother.', timestamp: '1 hour ago' },
    ],
  },
  {
    id: '2', authorName: 'Tom Rivera', authorAvatar: 'TR',
    content: "Finally organized my home office this weekend. It sounds small but it's made a huge difference for my focus and energy.",
    timestamp: '4 hours ago',
    reactions: [
      { type: 'heart', count: 7, reacted: false },
      { type: 'thumbsUp', count: 4, reacted: true },
    ],
    replies: [],
  },
  {
    id: '3', authorName: 'Alex Morgan', authorAvatar: 'AM',
    content: "Won my first 5K race! I've been training for 3 months and crossed the finish line at 24:32. Personal best!",
    timestamp: '6 hours ago',
    reactions: [
      { type: 'heart', count: 12, reacted: false },
      { type: 'star', count: 6, reacted: false },
      { type: 'award', count: 3, reacted: false },
    ],
    replies: [
      { authorName: 'Sarah Kim', authorAvatar: 'SK', content: "That's incredible Alex! What a milestone.", timestamp: '5 hours ago' },
      { authorName: 'Lisa Chen', authorAvatar: 'LC', content: 'Congrats! You should be really proud.', timestamp: '4 hours ago' },
    ],
  },
  {
    id: '4', authorName: 'Lisa Chen', authorAvatar: 'LC',
    content: "Resolved a tricky production bug that's been haunting us for 2 weeks. Turns out it was a timezone edge case. Feels good to finally squash it.",
    timestamp: '8 hours ago',
    reactions: [
      { type: 'thumbsUp', count: 8, reacted: false },
      { type: 'heart', count: 3, reacted: false },
    ],
    replies: [],
  },
];

interface WinsOfTheWeekBoardProps {
  prompt?: string;
}

export function WinsOfTheWeekBoard({ prompt }: WinsOfTheWeekBoardProps) {
  const { t } = useTranslation();
  const displayPrompt = prompt || t('gamePlay.winsOfWeek.defaultPrompt', 'Share your win from this week — work or personal, big or small!');
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [newPost, setNewPost] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set(['1', '3']));
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyFor, setShowReplyFor] = useState<string | null>(null);

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: String(Date.now()),
      authorName: 'You', authorAvatar: 'YO',
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
      return { ...p, replies: [...p.replies, { authorName: 'You', authorAvatar: 'YO', content: text, timestamp: 'Just now' }] };
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
            <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">YO</AvatarFallback>
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
        {posts.map(post => {
          const repliesExpanded = expandedReplies.has(post.id);
          return (
            <div key={post.id} className="rounded-xl border border-border bg-card overflow-hidden">
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
                      <button key={r.type} onClick={() => toggleReaction(post.id, r.type)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all",
                          r.reacted ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                        )}>
                        <Icon className={cn("h-3 w-3", r.reacted && 'fill-current')} />
                        {r.count}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-0.5">
                    {Object.entries(REACTION_ICONS)
                      .filter(([type]) => !post.reactions.some(r => r.type === type))
                      .slice(0, 2)
                      .map(([type, Icon]) => (
                        <button key={type} onClick={() => toggleReaction(post.id, type)}
                          className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                          <Icon className="h-3 w-3" />
                        </button>
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
                      <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-semibold">YO</AvatarFallback>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
