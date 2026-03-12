import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { GameParticipant } from './types';

interface LeaderboardSidebarProps {
  participants: GameParticipant[];
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderboardSidebar({ participants }: LeaderboardSidebarProps) {
  const { t } = useTranslation();

  const sorted = [...participants]
    .filter(p => p.status === 'joined')
    .sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...sorted.map(p => p.score), 1);
  const onlineCount = sorted.length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden lg:sticky lg:top-16">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-foreground">
            {t('gamePlay.leaderboard.title')}
          </h3>
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
            {onlineCount} {onlineCount === 1 ? 'teammate' : 'teammates'}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="p-2 space-y-0.5">
        {sorted.length === 0 && (
          <p className="text-center text-[12px] text-muted-foreground py-6">
            No teammates yet
          </p>
        )}
        {sorted.map((p, i) => {
          const rank = i + 1;
          const medal = RANK_MEDALS[rank];
          const scoreWidth = p.score > 0 ? (p.score / maxScore) * 100 : 0;

          return (
            <div
              key={p.id}
              className={cn(
                'relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors hover:bg-muted/50',
                rank === 1 && 'bg-warning/[0.04]'
              )}
            >
              {/* Score bar */}
              {scoreWidth > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-xl bg-primary/[0.04] pointer-events-none"
                  style={{ width: `${scoreWidth}%` }}
                />
              )}

              {/* Rank */}
              <div className="relative w-6 shrink-0 flex items-center justify-center">
                {medal ? (
                  <span className="text-[14px]">{medal}</span>
                ) : (
                  <span className="text-[11px] font-semibold text-muted-foreground/60 tabular-nums">{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-7 w-7 shrink-0 relative">
                {(p as any).avatarUrl && <AvatarImage src={(p as any).avatarUrl} />}
                <AvatarFallback className={cn(
                  'text-[9px] font-bold',
                  rank === 1 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
                )}>
                  {p.avatar}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1 min-w-0 relative">
                <p className={cn(
                  'truncate font-medium text-foreground',
                  rank === 1 ? 'text-[13px]' : 'text-[12px]'
                )}>
                  {p.name}
                  {p.isHost && <span className="ml-1 text-[9px] text-muted-foreground/60 font-normal">host</span>}
                </p>
              </div>

              {/* Score */}
              <div className="relative shrink-0 text-right">
                {p.score > 0 ? (
                  <span className={cn(
                    'font-bold tabular-nums',
                    rank === 1 ? 'text-[14px] text-warning' : 'text-[13px] text-foreground'
                  )}>
                    {p.score}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
