import { useTranslation } from 'react-i18next';
import { Clock, Crown, Zap, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { GameParticipant } from './types';

interface LeaderboardSidebarProps {
  participants: GameParticipant[];
}

export function LeaderboardSidebar({ participants }: LeaderboardSidebarProps) {
  const { t } = useTranslation();
  const sorted = [...participants].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'joined' ? -1 : 1;
    return b.score - a.score;
  });
  const maxScore = Math.max(...participants.map(p => p.score), 1);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden lg:sticky lg:top-16">
      <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-3.5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-[13px] font-bold text-foreground">{t('gamePlay.leaderboard.title')}</h3>
          </div>
          <Badge variant="outline" className="text-[9px] gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {t('gamePlay.leaderboard.online', { count: participants.filter(p => p.status === 'joined').length })}
          </Badge>
        </div>
      </div>

      <div className="p-2 space-y-0.5">
        {sorted.map((p, i) => {
          const isJoined = p.status === 'joined';
          const rank = isJoined ? sorted.filter((s, j) => s.status === 'joined' && j <= i).length : null;
          const scoreWidth = p.score > 0 ? (p.score / maxScore) * 100 : 0;

          return (
            <div key={p.id} className={cn(
              "relative flex items-center gap-2.5 p-2.5 rounded-xl transition-all group",
              isJoined ? 'hover:bg-accent/40' : 'opacity-40'
            )}>
              {p.score > 0 && (
                <div className="absolute inset-y-0 left-0 rounded-xl bg-primary/[0.04] transition-all duration-700"
                  style={{ width: `${scoreWidth}%` }} />
              )}

              <div className="relative w-6 flex items-center justify-center shrink-0">
                {rank && rank <= 3 ? (
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    rank === 1 && "bg-warning/20 text-warning ring-1 ring-warning/30",
                    rank === 2 && "bg-muted text-muted-foreground ring-1 ring-border",
                    rank === 3 && "bg-warning/10 text-warning/60 ring-1 ring-warning/15",
                  )}>
                    {rank}
                  </div>
                ) : rank ? (
                  <span className="text-[11px] font-semibold text-muted-foreground/50">{rank}</span>
                ) : (
                  <Clock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              <Avatar className="h-7 w-7 relative">
                <AvatarFallback className={cn(
                  "text-[9px] font-bold",
                  isJoined ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>{p.avatar}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 relative">
                <div className="flex items-center gap-1">
                  <p className="text-[12px] font-medium text-foreground truncate">{p.name}</p>
                  {p.isHost && <Crown className="h-3 w-3 text-warning shrink-0" />}
                </div>
                {isJoined && p.joinedAt && (
                  <p className="text-[9px] text-muted-foreground">{p.joinedAt}</p>
                )}
              </div>

              <div className="relative shrink-0">
                {p.score > 0 ? (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-[13px] font-bold text-primary tabular-nums">{p.score}</span>
                  </div>
                ) : !isJoined ? (
                  <Badge variant="outline" className="text-[8px] bg-muted/50 text-muted-foreground border-border h-[18px]">
                    {t('gamePlay.leaderboard.pending')}
                  </Badge>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
