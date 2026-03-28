import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { playRevealSound, playDrumroll, playVictoryCelebration, triggerHaptic, triggerScreenShake } from './audio';
import { AnimatedScore } from './AnimatedScore';
import { ConfettiParticles } from './ConfettiParticles';
import { Podium } from './Podium';

export interface ResultEntry {
  name: string;
  score: number;
  avatar: string;
  rank: number;
}

interface GameResultsProps {
  title?: string;
  subtitle?: string;
  results: ResultEntry[];
  onPlayAgain?: () => void;
  onExit?: () => void;
}

const RANK_LABELS_KEYS: Record<number, string> = { 1: 'gamePlay.results.champion', 2: 'gamePlay.results.runnerUp', 3: 'gamePlay.results.thirdPlace' };
const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

type RevealPhase = 'intro' | 'drumroll' | 'revealing' | 'podium' | 'final';

export function GameResults({ title, subtitle, results, onPlayAgain, onExit }: GameResultsProps) {
  const { t } = useTranslation();
  const displayTitle = title || t('gamePlay.results.gameComplete');
  const maxScore = Math.max(...results.map(r => r.score), 1);
  // Memoize to prevent new array references each render (which would loop the useEffect)
  const sortedResults = useMemo(() => [...results].sort((a, b) => a.rank - b.rank), [results]);
  const totalResults = sortedResults.length;
  const revealOrder = useMemo(() => [...sortedResults].reverse(), [sortedResults]);

  const [phase, setPhase] = useState<RevealPhase>('intro');
  const [revealedCount, setRevealedCount] = useState(0);
  const [showScores, setShowScores] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const drumrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startReveal = useCallback(() => {
    setPhase('drumroll');
    drumrollRef.current = playDrumroll();

    setTimeout(() => {
      if (drumrollRef.current) clearInterval(drumrollRef.current);
      setPhase('revealing');

      let idx = 0;
      const revealNext = () => {
        if (idx >= totalResults) {
          setTimeout(() => {
            setPhase('podium');
            setShowPodium(true);
            setTimeout(() => {
              setShowScores(true);
              setPhase('final');
              playVictoryCelebration();
              triggerScreenShake(containerRef.current, 'heavy');
            }, 800);
          }, 1200);
          return;
        }
        const rank = revealOrder[idx].rank;
        playRevealSound(rank);

        // Screen shake on #1 reveal
        if (rank === 1) {
          triggerScreenShake(containerRef.current, 'heavy');
        } else if (rank <= 3) {
          triggerScreenShake(containerRef.current, 'light');
        }

        setRevealedCount(idx + 1);
        idx++;
        const delay = rank <= 1 ? 2500 : rank <= 3 ? 1800 : 1000;
        setTimeout(revealNext, delay);
      };
      revealNext();
    }, 1500);
  }, [totalResults, revealOrder]);

  useEffect(() => {
    const timer = setTimeout(startReveal, 800);
    return () => { clearTimeout(timer); if (drumrollRef.current) clearInterval(drumrollRef.current); };
  }, [startReveal]);

  const skipToFinal = () => {
    if (drumrollRef.current) clearInterval(drumrollRef.current);
    setRevealedCount(totalResults);
    setShowPodium(true);
    setShowScores(true);
    setPhase('final');
    triggerHaptic('success');
  };

  return (
    <div ref={containerRef} className="rounded-2xl border border-border bg-card overflow-hidden relative">
      {phase === 'final' && <ConfettiParticles />}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-warning/[0.02] to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-warning/[0.06] rounded-full blur-[100px]" />

      <div className="relative p-6 sm:p-10">
        {/* Intro / Drumroll */}
        <AnimatePresence mode="wait">
          {(phase === 'intro' || phase === 'drumroll') && (
            <motion.div key="intro" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center py-12">
              <motion.div
                animate={phase === 'drumroll' ? { scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] } : {}}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-warning/25 to-primary/10 mx-auto mb-6 ring-4 ring-warning/15"
              >
                <Trophy className="h-12 w-12 text-warning" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">
                {phase === 'drumroll' ? t('gamePlay.results.andTheResultsAre') : displayTitle}
              </h2>
              <p className="text-[14px] text-muted-foreground mb-6">{subtitle || t('gamePlay.results.getReady')}</p>
              {phase === 'drumroll' && (
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }} className="flex items-center justify-center gap-2">
                  <span className="text-[14px] font-bold text-warning">{t('gamePlay.results.drumrollPlease')}</span>
                </motion.div>
              )}
              {phase !== 'drumroll' && (
                <Button onClick={skipToFinal} variant="ghost" size="sm" className="text-[12px] text-muted-foreground">{t('gamePlay.twoTruths.skipAnimation')}</Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reveal + Podium + Final */}
        {(phase === 'revealing' || phase === 'podium' || phase === 'final') && (
          <div className="space-y-6">
            {phase === 'revealing' && (
              <div className="flex justify-end">
                <Button onClick={skipToFinal} variant="ghost" size="sm" className="text-[11px] text-muted-foreground hover:text-foreground">{t('gamePlay.results.skipToResults')}</Button>
              </div>
            )}

            {showPodium && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                <Podium results={sortedResults} showScores={showScores} />
              </motion.div>
            )}

            {/* Ranking list */}
            <div className="space-y-2 max-w-lg mx-auto">
              <AnimatePresence>
                {revealOrder.slice(0, revealedCount).map((entry) => {
                  const barW = (entry.score / maxScore) * 100;
                  const isTop3 = entry.rank <= 3;

                  return (
                    <motion.div
                      key={entry.name}
                      initial={{ x: -40, opacity: 0, scale: 0.95 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
                      className={cn(
                        "relative flex items-center gap-3 p-3.5 sm:p-4 rounded-xl overflow-hidden border transition-all",
                        isTop3 && entry.rank === 1 && 'border-warning/30 bg-warning/[0.06] shadow-sm shadow-warning/10',
                        isTop3 && entry.rank === 2 && 'border-border bg-muted/30',
                        isTop3 && entry.rank === 3 && 'border-warning/15 bg-warning/[0.03]',
                        !isTop3 && 'border-border bg-card',
                      )}
                    >
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barW}%` }} transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                        className={cn("absolute inset-y-0 left-0 rounded-xl", entry.rank === 1 ? 'bg-warning/[0.06]' : 'bg-primary/[0.03]')} />

                      <div className="relative shrink-0">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-black",
                          entry.rank === 1 && 'bg-warning/20 text-warning ring-2 ring-warning/30',
                          entry.rank === 2 && 'bg-muted text-muted-foreground ring-1 ring-border',
                          entry.rank === 3 && 'bg-warning/10 text-warning/70 ring-1 ring-warning/20',
                          entry.rank > 3 && 'bg-muted/60 text-muted-foreground/50',
                        )}>
                          {RANK_EMOJI[entry.rank] || entry.rank}
                        </div>
                      </div>

                      <Avatar className="h-9 w-9 relative shrink-0">
                        <AvatarFallback className={cn("text-[10px] font-bold", isTop3 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                          {entry.avatar}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 relative">
                        <p className={cn("font-semibold text-foreground truncate", isTop3 ? 'text-[14px]' : 'text-[13px]')}>{entry.name}</p>
                        {RANK_LABELS_KEYS[entry.rank] && (
                          <p className={cn("text-[10px] font-medium",
                            entry.rank === 1 ? 'text-warning' : entry.rank === 2 ? 'text-muted-foreground' : 'text-warning/70'
                          )}>{t(RANK_LABELS_KEYS[entry.rank])}</p>
                        )}
                      </div>

                      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: 'spring' as const, stiffness: 400 }}
                        className="relative flex items-center gap-1 shrink-0">
                        <span className={cn("font-black tabular-nums",
                          entry.rank === 1 ? 'text-[18px] text-warning' : isTop3 ? 'text-[16px] text-foreground' : 'text-[14px] text-muted-foreground'
                        )}>
                          {showScores ? <AnimatedScore target={entry.score} duration={800} /> : '—'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">{t('gamePlay.results.pts')}</span>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Actions */}
            {phase === 'final' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-3 pt-4">
                {onPlayAgain && (
                  <Button variant="outline" size="lg" className="h-12 text-[13px] gap-2 rounded-xl" onClick={onPlayAgain}>
                    <RotateCcw className="h-4 w-4" /> {t('gamePlay.results.playAgain')}
                  </Button>
                )}
                {onExit && (
                  <Button variant="brand" size="xl" className="gap-2 shadow-lg shadow-primary/20" onClick={onExit}>
                    <ArrowRight className="h-4 w-4" /> {t('gamePlay.results.backToEvents')}
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
