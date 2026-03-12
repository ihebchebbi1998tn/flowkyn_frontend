import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, CheckCircle, ThumbsUp, ThumbsDown, AlertCircle,
  Trophy, ChevronRight, Sparkles, Target, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RoundIndicator, PhaseTimer, PhaseBadge, GameResults, CountdownOverlay, type GamePhase } from '../shared';

interface Statement {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isLie?: boolean;
}

export interface TwoTruthsBoardProps {
  onRoundComplete?: (roundNumber: number) => void;
  participants: any[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
}

export function TwoTruthsBoard({ onRoundComplete, participants, currentUserId, currentUserName, currentUserAvatar }: TwoTruthsBoardProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [round, setRound] = useState(1);
  const totalRounds = 4;
  const [timeLeft, setTimeLeft] = useState(30);
  const [statements, setStatements] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [revealedLie, setRevealedLie] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  const [showDrumroll, setShowDrumroll] = useState(false);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setTimeout(() => { setPhase('vote'); setTimeLeft(20); }, 1500);
  }, []);

  const handleVote = useCallback(() => {
    setVoted(true);
    setTimeout(() => { 
      setPhase('reveal'); 
      setShowDrumroll(true);
      setTimeout(() => {
        setRevealedLie('s2'); 
        setShowDrumroll(false);
      }, 3500); // 3.5s dramatic delay
    }, 1500);
  }, []);

  useEffect(() => {
    if ((phase === 'submit' || phase === 'vote') && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timeLeft === 0 && phase === 'submit' && !submitted) handleSubmit();
    if (timeLeft === 0 && phase === 'vote' && !voted) handleVote();
  }, [phase, timeLeft, submitted, voted, handleSubmit, handleVote]);

  const handleNextRound = () => {
    if (round >= totalRounds) {
      setPhase('results');
    } else {
      onRoundComplete?.(round);
      setRound(r => r + 1);
      setPhase('submit');
      setTimeLeft(30);
      setSubmitted(false);
      setSelectedVote(null);
      setVoted(false);
      setRevealedLie(null);
      setShowDrumroll(false);
      setStatements(['', '', '']);
    }
  };

  const startGame = () => { setShowCountdown(true); };
  const handleCountdownDone = useCallback(() => {
    setShowCountdown(false);
    setPhase('submit');
    setTimeLeft(30);
  }, []);
  const maxTime = phase === 'submit' ? 30 : 20;

  const targetStatements: Statement[] = [
    { id: 's0', text: statements[0] || 'Statement 1', authorId: currentUserId, authorName: currentUserName, authorAvatar: currentUserAvatar },
    { id: 's1', text: statements[1] || 'Statement 2', authorId: currentUserId, authorName: currentUserName, authorAvatar: currentUserAvatar },
    { id: 's2', text: statements[2] || 'Statement 3 (Lie)', authorId: currentUserId, authorName: currentUserName, authorAvatar: currentUserAvatar, isLie: true },
  ];
  
  const mockTally = [
    { statementId: 's0', count: Math.floor(participants.length * 0.2), percentage: 20 },
    { statementId: 's1', count: Math.floor(participants.length * 0.3), percentage: 30 },
    { statementId: 's2', count: Math.max(1, Math.floor(participants.length * 0.5)), percentage: 50 },
  ];

  const results = participants.map((p, i) => ({
    name: p.name,
    score: p.id === currentUserId ? 300 : Math.floor(Math.random() * 200),
    avatar: p.avatar,
    rank: i + 1
  })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));

  return (
    <div className="space-y-4">
      <CountdownOverlay active={showCountdown} onComplete={handleCountdownDone} />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <RoundIndicator currentRound={round} totalRounds={totalRounds} />
            <div className="flex items-center gap-3">
              <PhaseBadge phase={phase} />
              {(phase === 'submit' || phase === 'vote') && <PhaseTimer timeLeft={timeLeft} maxTime={maxTime} />}
            </div>
          </div>
        </div>
      </div>

      {/* WAITING */}
      {phase === 'waiting' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="relative p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-5 ring-4 ring-primary/10">
                <Target className="h-9 w-9 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t('gamePlay.twoTruths.title')}</h3>
              <p className="text-[13px] text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                {t('gamePlay.twoTruths.description')}
              </p>
              <Button variant="brand" onClick={startGame} size="xl" className="px-10 gap-2.5 shadow-lg shadow-primary/20">
                <Zap className="h-5 w-5" /> {t('gamePlay.twoTruths.startRound', { round: 1 })}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT */}
      {phase === 'submit' && !submitted && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Send className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.twoTruths.yourTurn')}</h3>
                <p className="text-[11px] text-muted-foreground">{t('gamePlay.twoTruths.makeItBelievable')}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {statements.map((s, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    s.trim() ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}>{String.fromCharCode(65 + i)}</span>
                   <label className="text-[11px] font-medium text-muted-foreground">{t('gamePlay.twoTruths.statementLabel', { num: i + 1 })}</label>
                </div>
                <Textarea
                  value={s}
                  onChange={e => { const next = [...statements]; next[i] = e.target.value; setStatements(next); }}
                  placeholder={i === 2 ? t('gamePlay.twoTruths.liePlaceholder') : t('gamePlay.twoTruths.truthPlaceholder')}
                  rows={1}
                  className="text-[13px] resize-none min-h-[44px] rounded-xl border-border/60 focus:border-primary/40 transition-all"
                />
              </div>
            ))}
            <div className="flex justify-end pt-3">
              <Button onClick={handleSubmit} disabled={statements.some(s => !s.trim())} className="h-10 px-6 text-[13px] gap-2 rounded-xl">
                <Send className="h-4 w-4" /> {t('gamePlay.twoTruths.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted waiting */}
      {phase === 'submit' && submitted && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center animate-scale-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-4 ring-4 ring-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-[16px] font-bold text-foreground mb-1">{t('gamePlay.twoTruths.submitted')}</h3>
          <p className="text-[12px] text-muted-foreground">{t('gamePlay.twoTruths.waitingForVotes')}</p>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[0, 0.2, 0.4].map((d, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${d}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* VOTE */}
      {phase === 'vote' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-warning/5 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-warning/20 ring-offset-2 ring-offset-card">
                <AvatarFallback className="bg-info/10 text-info text-[10px] font-bold">{currentUserAvatar}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.twoTruths.statementsOf', { name: currentUserName })}</h3>
                <p className="text-[11px] text-muted-foreground">{t('gamePlay.twoTruths.spotTheLie')}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-2.5">
            {targetStatements.map((stmt, i) => (
              <motion.button
                key={stmt.id}
                onClick={() => !voted && setSelectedVote(stmt.id)}
                disabled={voted}
                whileHover={!voted ? { scale: 1.015, y: -2 } : {}}
                whileTap={!voted ? { scale: 0.98 } : {}}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 group/vote relative overflow-hidden",
                  selectedVote === stmt.id
                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                    : 'border-border hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm',
                  voted && 'cursor-default opacity-80'
                )}
              >
                {/* Selection background animation */}
                <AnimatePresence>
                  {selectedVote === stmt.id && (
                     <motion.div 
                       layoutId="selected-vote-bg"
                       className="absolute inset-0 bg-primary/5 pointer-events-none"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                     />
                  )}
                </AnimatePresence>
                
                <div className="flex items-start gap-3 relative z-10">
                  <span className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold shrink-0 transition-all",
                    selectedVote === stmt.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground group-hover/vote:bg-primary/10 group-hover/vote:text-primary'
                  )}>{String.fromCharCode(65 + i)}</span>
                  <p className="text-[13px] text-foreground leading-relaxed pt-0.5">{stmt.text}</p>
                  {selectedVote === stmt.id && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="ml-auto"
                    >
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            ))}
            {!voted && (
              <div className="flex justify-end pt-3">
                <Button onClick={handleVote} disabled={!selectedVote} className="h-10 px-6 text-[13px] gap-2 rounded-xl">
                   <ThumbsUp className="h-4 w-4" /> {t('gamePlay.twoTruths.lockVote')}
                </Button>
              </div>
            )}
            {voted && (
              <div className="p-3 rounded-xl bg-success/[0.06] border border-success/20 text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2">
                   <CheckCircle className="h-4 w-4 text-success" />
                   <p className="text-[12px] text-success font-semibold">{t('gamePlay.twoTruths.voteLocked')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVEAL */}
      {phase === 'reveal' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in relative">
          
          {/* Drumroll Overlay */}
          <AnimatePresence>
            {showDrumroll && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/90 backdrop-blur-md"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6"
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Finding the truth...</h2>
                <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.5, ease: "easeInOut" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-info/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/10">
                <Sparkles className="h-4 w-4 text-info" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.twoTruths.theReveal')}</h3>
                <p className="text-[11px] text-muted-foreground">{t('gamePlay.twoTruths.seeVotes')}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-2.5">
            {targetStatements.map((stmt, i) => {
              const tally = mockTally.find(t => t.statementId === stmt.id);
              const isLie = stmt.id === revealedLie;
              const wasMyVote = selectedVote === stmt.id;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 + (showDrumroll ? 0 : 0.4) }}
                  key={stmt.id} 
                  className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  isLie ? 'border-destructive/40 bg-destructive/[0.04]' : 'border-success/30 bg-success/[0.03]'
                )}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold shrink-0",
                        isLie ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'
                      )}>{String.fromCharCode(65 + i)}</span>
                      <div>
                        <p className="text-[13px] text-foreground leading-relaxed">{stmt.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={cn("text-[9px] gap-1",
                            isLie ? 'border-destructive/30 text-destructive bg-destructive/5' : 'border-success/30 text-success bg-success/5'
                          )}>
                            {isLie ? <><AlertCircle className="h-2.5 w-2.5" /> {t('gamePlay.twoTruths.lie')}</> : <><CheckCircle className="h-2.5 w-2.5" /> {t('gamePlay.twoTruths.truth')}</>}
                          </Badge>
                          {wasMyVote && (
                             <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/5 gap-1">
                              <Target className="h-2.5 w-2.5" /> {t('gamePlay.twoTruths.yourPick')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {tally && (
                    <div className="ml-10 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000",
                            isLie ? 'bg-destructive/60' : 'bg-success/50'
                          )} style={{ width: `${tally.percentage}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium w-16 text-right">{t('gamePlay.twoTruths.votes', { count: tally.count, pct: tally.percentage })}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/20">
            <div>
              {selectedVote === revealedLie ? (
                <div className="flex items-center gap-2 animate-scale-in">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
                    <Zap className="h-4 w-4 text-success" />
                  </div>
                  <div>
                     <p className="text-[13px] font-bold text-success">{t('gamePlay.twoTruths.correct')}</p>
                     <p className="text-[10px] text-muted-foreground">{t('gamePlay.twoTruths.greatWork')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                    <ThumbsDown className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                     <p className="text-[13px] font-bold text-destructive">{t('gamePlay.twoTruths.wrongGuess')}</p>
                     <p className="text-[10px] text-muted-foreground">{t('gamePlay.twoTruths.betterLuck')}</p>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleNextRound} className="h-10 px-6 text-[13px] gap-2 rounded-xl">
              {round >= totalRounds ? <><Trophy className="h-4 w-4" /> {t('gamePlay.twoTruths.viewResults')}</> : <><ChevronRight className="h-4 w-4" /> {t('gamePlay.twoTruths.nextRound')}</>}
            </Button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <GameResults
          subtitle={t('gamePlay.results.roundsPlayed', { count: totalRounds })}
          results={results}
          onPlayAgain={() => {
            setPhase('waiting');
            setRound(1);
            setTimeLeft(30);
            setSubmitted(false);
            setSelectedVote(null);
            setVoted(false);
            setRevealedLie(null);
            setStatements(['', '', '']);
          }}
        />
      )}
    </div>
  );
}
