import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, BarChart3, Trophy, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameActionButton } from '../../shared';
import { gamesApi } from '@/features/app/api/games';
import { cn } from '@/lib/utils';

interface DebriefRanking {
  participantId: string;
  name?: string;
  roleKey?: string;
  avatar?: string;
  actionCount?: number;
  score: number;
  rank: number;
}

interface DebriefResults {
  rankings?: DebriefRanking[];
  stats?: { totalActions: number; avgScore: number; completionRate: number; topRole?: string };
  sessionId?: string;
  totalActions?: number;
  participantCount?: number;
  mostVocalRole?: string;
  actionsByRole?: Record<string, number>;
  rolesPresent?: string[];
}

interface Props {
  isHost: boolean;
  eventId: string;
  sessionId: string | null;
}

export function StrategicDebriefPhase({ isHost, eventId, sessionId }: Props) {
  const { t } = useTranslation();
  const [results, setResults] = useState<DebriefResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedDebrief, setHasStartedDebrief] = useState(false);

  // Try to load debrief results
  useEffect(() => {
    if (!sessionId || !eventId) return;
    let cancelled = false;
    setIsLoading(true);
    gamesApi.getDebriefResults(sessionId)
      .then(res => { if (!cancelled) { setResults(res as DebriefResults); setHasStartedDebrief(true); } })
      .catch(() => { if (!cancelled) setResults(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId, eventId]);

  const handleStartDebrief = async () => {
    if (!sessionId || !eventId || !isHost) return;
    setIsLoading(true);
    try {
      const res = await gamesApi.startDebrief(sessionId);
      setResults(res as DebriefResults);
      setHasStartedDebrief(true);
    } catch (err: unknown) {
      console.error('[StrategicDebriefPhase] Failed to start debrief:', err);
      const { toast } = await import('sonner');
      toast.error(t('strategic.debrief.startFailed', { defaultValue: 'Failed to calculate debrief results. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const rankings = results?.rankings || [];
  const stats = results?.stats;

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      {stats && (
        <motion.div
          className="grid gap-3 grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, staggerChildren: 0.1 }}
        >
          {[
            { icon: BarChart3, label: t('strategic.debrief.totalActions', { defaultValue: 'Total actions' }), value: stats.totalActions, color: 'text-primary' },
            { icon: TrendingUp, label: t('strategic.debrief.avgScore', { defaultValue: 'Avg score' }), value: `${Math.round(stats.avgScore)}%`, color: 'text-success' },
            { icon: Users, label: t('strategic.debrief.completion', { defaultValue: 'Completion' }), value: `${Math.round(stats.completionRate)}%`, color: 'text-info' },
            { icon: Trophy, label: t('strategic.debrief.topRole', { defaultValue: 'Top role' }), value: stats.topRole || '—', color: 'text-warning' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-4 space-y-1"
            >
              <stat.icon className={cn('h-4 w-4', stat.color)} />
              <p className="text-[20px] font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
        {/* Rankings */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <p className="text-sm font-semibold text-foreground">
              {t('strategic.debrief.rankingsTitle', { defaultValue: 'Participant rankings' })}
            </p>
          </div>

          {rankings.length > 0 ? (
            <div className="space-y-2">
              {rankings.map((r, i) => (
                <motion.div
                  key={r.participantId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5',
                    i === 0 ? 'border-warning/40 bg-warning/5' : 'border-border bg-background/50',
                  )}
                >
                  <span className={cn(
                    'flex items-center justify-center h-7 w-7 rounded-full text-[12px] font-bold',
                    i === 0 ? 'bg-warning/15 text-warning' : i === 1 ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground',
                  )}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : r.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{r.name}</p>
                  </div>
                  <span className="text-[13px] font-bold tabular-nums text-foreground">{r.score}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {isHost && !hasStartedDebrief && (
                <GameActionButton size="md" className="w-full text-[12px]" onClick={handleStartDebrief} disabled={isLoading}>
                  {isLoading
                    ? t('strategic.debrief.calculating', { defaultValue: 'Calculating results…' })
                    : t('strategic.debrief.startDebrief', { defaultValue: 'Calculate debrief results' })}
                </GameActionButton>
              )}
              {!isHost && !hasStartedDebrief && (
                <p className="text-[11px] text-muted-foreground">
                  {t('strategic.debrief.waitingForHost', { defaultValue: 'Waiting for the facilitator to calculate results…' })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Reflection */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-success" />
              <p className="text-sm font-semibold text-foreground">
                {t('strategic.debrief.title', { defaultValue: 'What did we learn?' })}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-[12px]">
                  {t('strategic.debrief.questionsTitle', { defaultValue: 'Reflect together' })}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>{t('strategic.debrief.q1', { defaultValue: 'Where did we move too fast or too slow?' })}</li>
                  <li>{t('strategic.debrief.q2', { defaultValue: 'Which roles saw risk earliest?' })}</li>
                  <li>{t('strategic.debrief.q3', { defaultValue: 'What would we do differently tomorrow?' })}</li>
                </ul>
              </div>
              <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-[12px]">
                  {t('strategic.debrief.actionsTitle', { defaultValue: 'Turn insights into actions' })}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>{t('strategic.debrief.a1', { defaultValue: 'Capture 2–3 concrete changes.' })}</li>
                  <li>{t('strategic.debrief.a2', { defaultValue: 'Assign clear owners and deadlines.' })}</li>
                  <li>{t('strategic.debrief.a3', { defaultValue: 'Schedule a follow-up in 4–6 weeks.' })}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
