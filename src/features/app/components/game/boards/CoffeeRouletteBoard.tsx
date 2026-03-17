import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Coffee, Shuffle, MessageCircle, Clock, Users,
  Zap, CheckCircle, ArrowRight, Sparkles, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { motion } from 'framer-motion';
import { PhaseBadge, CountdownOverlay, type GamePhase } from '../shared';
import { GAME_TYPES } from '@/features/app/pages/play/gameTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function shouldEnableTilt() {
  // Avoid tilt on touch devices
  return typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(pointer: coarse)').matches;
}

type CoffeeSnapshot = {
  kind: typeof GAME_TYPES.COFFEE_ROULETTE;
  phase: 'waiting' | 'matching' | 'chatting' | 'complete';
  pairs: Array<{
    id: string;
    person1: { participantId: string; name: string; avatar: string; avatarUrl?: string | null };
    person2: { participantId: string; name: string; avatar: string; avatarUrl?: string | null };
    topic: string;
  }>;
  startedChatAt: string | null;
  chatEndsAt?: string;
  promptsUsed?: number;
  decisionRequired?: boolean;
};

export interface CoffeeRouletteBoardProps {
  participants: any[];
  currentUserId: string;
  initialSnapshot?: any;
  gameData?: any;
  onEmitAction: (actionType: string, payload?: any) => Promise<void>;
}

export function CoffeeRouletteBoard({ participants, currentUserId, initialSnapshot, gameData, onEmitAction }: CoffeeRouletteBoardProps) {
  const { t } = useTranslation();
  const snapshot: CoffeeSnapshot | null = (gameData?.kind === GAME_TYPES.COFFEE_ROULETTE
    ? gameData
    : (initialSnapshot?.kind === GAME_TYPES.COFFEE_ROULETTE ? initialSnapshot : null)) as any;

  const phase = (snapshot?.phase || 'waiting') as GamePhase;
  const pairs = snapshot?.pairs || [];
  const myPair = pairs.find((p) => p.person1.participantId === currentUserId || p.person2.participantId === currentUserId) || null;
  const chatEndsAt = snapshot?.chatEndsAt || null;
  const promptsUsed = snapshot?.promptsUsed || 0;
  const decisionRequired = !!snapshot?.decisionRequired;

  // Initialize from server timestamp so late-joiners see the correct remaining time
  const [chatSecondsRemaining, setChatSecondsRemaining] = useState(() => {
    if (chatEndsAt) {
      return Math.max(0, Math.ceil((new Date(chatEndsAt).getTime() - Date.now()) / 1000));
    }
    return 30 * 60;
  });
  const [showCountdown, setShowCountdown] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [isSpinningTopic, setIsSpinningTopic] = useState(false);
  const [displayTopic, setDisplayTopic] = useState<string>('');
  const topicSpinTimerRef = useRef<number | null>(null);
  const autoStartedChatRef = useRef(false);
  // Capture elapsed chat time so the 'complete' phase shows the correct value
  // instead of resetting to 0 when chatSecondsRemaining resets.
  const capturedElapsedRef = useRef(0);

  const spinTopicPool = useMemo(
    () => ([
      t('gamePlay.coffeeRoulette.topicPool.p1', { defaultValue: "What's something you're excited about lately?" }),
      t('gamePlay.coffeeRoulette.topicPool.p2', { defaultValue: 'What’s a small win you had this week?' }),
      t('gamePlay.coffeeRoulette.topicPool.p3', { defaultValue: 'What’s a hobby you wish you had more time for?' }),
      t('gamePlay.coffeeRoulette.topicPool.p4', { defaultValue: 'What’s the best advice you’ve received?' }),
      t('gamePlay.coffeeRoulette.topicPool.p5', { defaultValue: 'What’s something you learned recently?' }),
      t('gamePlay.coffeeRoulette.topicPool.p6', { defaultValue: 'If you could travel anywhere, where would you go?' }),
      t('gamePlay.coffeeRoulette.topicPool.p7', { defaultValue: 'What’s a book/movie you recommend?' }),
      t('gamePlay.coffeeRoulette.topicPool.p8', { defaultValue: 'What’s one thing you’re looking forward to?' }),
    ]),
    [t]
  );

  const startMatching = () => {
    console.log('[CoffeeRouletteBoard] startMatching', {
      participantsCount: participants.length,
    });
    setShowCountdown(true);
  };

  const handleCountdownDone = useCallback(() => {
    setShowCountdown(false);
    console.log('[CoffeeRouletteBoard] handleCountdownDone -> coffee:shuffle');
    onEmitAction('coffee:shuffle', {});
  }, [onEmitAction]);

  const startChatting = () => {
    console.log('[CoffeeRouletteBoard] startChatting -> coffee:start_chat');
    onEmitAction('coffee:start_chat', {});
  };

  // Auto-start chat for everyone once pairs are set.
  // Backend treats coffee:start_chat as idempotent to prevent timer resets,
  // so it's safe for any paired participant to emit once.
  useEffect(() => {
    if (phase !== 'matching') {
      autoStartedChatRef.current = false;
      return;
    }
    if (!myPair) return;
    if (snapshot?.startedChatAt) return;
    if (autoStartedChatRef.current) return;

    autoStartedChatRef.current = true;
    console.log('[CoffeeRouletteBoard] autoStartChat -> coffee:start_chat', { currentUserId, pairId: myPair.id });
    onEmitAction('coffee:start_chat', {});
  }, [phase, myPair, snapshot?.startedChatAt, currentUserId, onEmitAction]);

  const endSession = () => {
    console.log('[CoffeeRouletteBoard] endSession -> coffee:end');
    onEmitAction('coffee:end', {});
  };
  const endAndFinishSession = useCallback(async () => {
    // End snapshot + close DB session in one server-side action (allowed for all participants)
    await onEmitAction('coffee:end_and_finish', {});
  }, [onEmitAction]);

  // Keep displayed topic in sync unless we are spinning
  useEffect(() => {
    if (isSpinningTopic) return;
    setDisplayTopic(myPair?.topic || '');
  }, [myPair?.topic, isSpinningTopic]);

  // Cleanup spin interval
  useEffect(() => {
    return () => {
      if (topicSpinTimerRef.current) {
        window.clearInterval(topicSpinTimerRef.current);
        topicSpinTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== 'chatting' || !chatEndsAt) {
      // When leaving chatting phase, capture the elapsed time before resetting
      if (phase !== 'chatting') {
        capturedElapsedRef.current = Math.floor((30 * 60 - chatSecondsRemaining) / 60);
        setChatSecondsRemaining(30 * 60);
      }
      return;
    }

    // Sync immediately on mount or chatEndsAt change
    const syncNow = () => {
      const remaining = Math.max(0, Math.ceil((new Date(chatEndsAt).getTime() - Date.now()) / 1000));
      setChatSecondsRemaining(remaining);
      return remaining;
    };
    if (syncNow() === 0) return;

    const interval = setInterval(() => {
      if (syncNow() === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, chatEndsAt]);

  // When server requires a decision (after ~6 prompts), open the modal.
  useEffect(() => {
    if (phase === 'chatting' && decisionRequired) {
      setShowDecisionModal(true);
    } else {
      setShowDecisionModal(false);
    }
  }, [phase, decisionRequired]);

  const displayMinutes = Math.floor(chatSecondsRemaining / 60);
  const displaySeconds = chatSecondsRemaining % 60;
  const chatMinutesElapsed = phase === 'complete'
    ? (capturedElapsedRef.current || Math.floor((30 * 60 - chatSecondsRemaining) / 60))
    : Math.floor((30 * 60 - chatSecondsRemaining) / 60);

  return (
    <div className="space-y-4">
      <CountdownOverlay active={showCountdown} onComplete={handleCountdownDone} accentColor="info" finalText="MATCH!" />
      <Dialog open={showDecisionModal} onOpenChange={setShowDecisionModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('gamePlay.coffeeRoulette.decision.title', { defaultValue: 'Keep going?' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">
              {t('gamePlay.coffeeRoulette.decision.body', {
                defaultValue: "You've gone through {{count}} prompts. Want to keep going or end this chat?",
                count: promptsUsed || 6,
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await onEmitAction('coffee:continue', {});
                  setShowDecisionModal(false);
                }}
                className="h-10"
              >
                {t('gamePlay.coffeeRoulette.decision.continue', { defaultValue: 'Keep going' })}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await endAndFinishSession();
                  setShowDecisionModal(false);
                }}
                className="h-10"
              >
                {t('gamePlay.coffeeRoulette.decision.end', { defaultValue: 'End chat' })}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('gamePlay.coffeeRoulette.decision.hint', { defaultValue: 'You can always reshuffle to meet someone new.' })}
            </p>
          </div>
        </DialogContent>
      </Dialog>
      {/* Phase header */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <Coffee className="h-5 w-5 text-info" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">
                  {t('gamePlay.coffeeRoulette.title', { defaultValue: 'Coffee Roulette' })}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {t('gamePlay.coffeeRoulette.subtitle', { defaultValue: 'Quick 1:1 connections for your team' })}
                </p>
              </div>
            </div>
            <PhaseBadge phase={phase} />
          </div>
        </div>
      </div>

      {/* WAITING — Pre-match screen */}
      {phase === 'waiting' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="relative p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-info/5 to-transparent" />
            <div className="relative z-10">
              <motion.div 
                animate={participants.length < 2 ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-info/20 to-info/5 mx-auto mb-5 ring-4 ring-info/10 relative overflow-hidden"
              >
                {participants.length < 2 && (
                   <motion.div 
                     className="absolute inset-0 bg-info/20"
                     animate={{ opacity: [0, 0.5, 0] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   />
                )}
                <Shuffle className="h-9 w-9 text-info relative z-10" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                 {participants.length < 2
                   ? t('gamePlay.coffeeRoulette.waitingForOthers', { defaultValue: 'Waiting for teammates…' })
                   : t('gamePlay.coffeeRoulette.readyToConnect', { defaultValue: 'Ready to connect' })}
               </h3>
              <p className="text-[13px] text-muted-foreground mb-3 max-w-md mx-auto leading-relaxed">
                {participants.length < 2
                  ? t('gamePlay.coffeeRoulette.needMoreParticipants', { defaultValue: 'We need at least 2 people to start. Share the invite link to get started.' })
                  : t('gamePlay.coffeeRoulette.description', { defaultValue: 'Get paired into 1:1 chats with a conversation starter.' })}
              </p>
              <div className="flex items-center justify-center gap-4 mb-8 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t('gamePlay.coffeeRoulette.minutes', { defaultValue: '30 minutes' })}</span>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {participants.length} {t('analyticsPage.participants')}</span>
              </div>
              <Button variant="brand" onClick={startMatching} disabled={participants.length < 2} size="xl" className="px-10 gap-2.5 shadow-lg shadow-primary/20">
                <Shuffle className="h-5 w-5" /> {participants.length < 2 ? t('gamePlay.coffeeRoulette.waitingForTeam', { defaultValue: 'Waiting for more teammates…' }) : t('gamePlay.coffeeRoulette.shuffleMatch', { defaultValue: 'Shuffle match' })}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MATCHING — Show pairs */}
      {phase === 'matching' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-info/5 to-transparent">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-info" />
                <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.coffeeRoulette.pairsSet', { defaultValue: 'Pairs are set' })}</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {pairs.map((pair, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  key={pair.id} 
                  className="relative"
                >
                  <div
                    className={cn(
                      'group relative w-full rounded-2xl border overflow-hidden',
                      'bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]',
                      'backdrop-blur-md',
                      i === 0
                        ? 'border-info/30 ring-2 ring-info/10 shadow-[0_12px_40px_rgba(59,130,246,0.12)]'
                        : 'border-border/70 shadow-[0_10px_30px_rgba(0,0,0,0.06)]',
                    )}
                    style={{
                      transformStyle: 'preserve-3d',
                      perspective: '900px',
                    }}
                    onMouseMove={(e) => {
                      if (!shouldEnableTilt()) return;
                      const el = e.currentTarget;
                      const rect = el.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const px = (x / rect.width) * 2 - 1; // -1..1
                      const py = (y / rect.height) * 2 - 1; // -1..1
                      const rotateY = clamp(px * 6, -6, 6);
                      const rotateX = clamp(-py * 6, -6, 6);
                      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-16 -right-20 h-40 w-40 rounded-full bg-info/10 blur-2xl" />
                      <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.20),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,0.10),transparent_55%)]" />
                    </div>

                    <div className="relative flex items-center gap-4 p-4 sm:p-5">
                      {/* Person 1 */}
                      <motion.div 
                        initial={{ x: -24, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.15 + 0.18, type: 'spring', stiffness: 220, damping: 18 }}
                        className="flex items-center gap-2 flex-1 min-w-0"
                        style={{ transform: 'translateZ(18px)' }}
                      >
                        <Avatar className="h-10 w-10 ring-2 ring-info/20">
                          {pair.person1.avatarUrl ? <AvatarImage src={getSafeImageUrl(pair.person1.avatarUrl) || pair.person1.avatarUrl} alt={pair.person1.name} /> : null}
                          <AvatarFallback className="bg-info/10 text-info text-[11px] font-bold">{pair.person1.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] font-medium text-foreground truncate">{pair.person1.name}</span>
                      </motion.div>

                      {/* Connector */}
                      <motion.div 
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.15 + 0.34, type: 'spring', stiffness: 200, damping: 16 }}
                        className="flex items-center gap-1.5 shrink-0"
                        style={{ transform: 'translateZ(24px)' }}
                      >
                        <div className="h-px w-4 bg-border/80" />
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-info/10 border border-info/15">
                          <Coffee className="h-4 w-4 text-info" />
                        </div>
                        <div className="h-px w-4 bg-border/80" />
                      </motion.div>

                      {/* Person 2 */}
                      <motion.div 
                        initial={{ x: 24, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.15 + 0.18, type: 'spring', stiffness: 220, damping: 18 }}
                        className="flex items-center gap-2 flex-1 min-w-0 justify-end"
                        style={{ transform: 'translateZ(18px)' }}
                      >
                        <span className="text-[13px] font-medium text-foreground truncate">{pair.person2.name}</span>
                        <Avatar className="h-10 w-10 ring-2 ring-info/20">
                          {pair.person2.avatarUrl ? <AvatarImage src={getSafeImageUrl(pair.person2.avatarUrl) || pair.person2.avatarUrl} alt={pair.person2.name} /> : null}
                          <AvatarFallback className="bg-info/10 text-info text-[11px] font-bold">{pair.person2.avatar}</AvatarFallback>
                        </Avatar>
                      </motion.div>

                      {(pair.person1.participantId === currentUserId || pair.person2.participantId === currentUserId) && (
                        <Badge className="text-[9px] bg-info/15 text-info border-info/25 shrink-0">{t('gamePlay.coffeeRoulette.you', { defaultValue: 'You' })}</Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Your conversation starter */}
          <div className="rounded-2xl border border-info/20 bg-info/[0.03] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/10 shrink-0">
                <MessageCircle className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-info uppercase tracking-wider mb-1">{t('gamePlay.coffeeRoulette.conversationStarter', { defaultValue: 'Conversation starter' })}</p>
                <p className="text-[14px] text-foreground font-medium leading-relaxed">"{myPair?.topic || t('gamePlay.coffeeRoulette.defaultTopic', { defaultValue: "What's something you're excited about lately?" })}"</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
          <Button variant="brand" onClick={startChatting} disabled={!myPair} size="xl" className="px-10 gap-2.5 shadow-lg shadow-primary/20">
              <MessageCircle className="h-5 w-5" /> {t('gamePlay.coffeeRoulette.startChatting', { defaultValue: 'Start chatting' })}
            </Button>
          </div>
        </div>
      )}

      {/* CHATTING — Active session (paired user) */}
      {phase === 'chatting' && myPair && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 ring-4 ring-info/20 mx-auto mb-2">
                    {myPair.person1.avatarUrl ? <AvatarImage src={getSafeImageUrl(myPair.person1.avatarUrl) || myPair.person1.avatarUrl} alt={myPair.person1.name} /> : null}
                    <AvatarFallback className="bg-info/10 text-info text-lg font-bold">{myPair.person1.avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-[13px] font-semibold text-foreground">{myPair.person1.name}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Coffee className="h-6 w-6 text-info" />
                  <div className="h-px w-12 bg-border" />
                </div>
                <div className="text-center">
                  <Avatar className="h-16 w-16 ring-4 ring-info/20 mx-auto mb-2">
                    {myPair.person2.avatarUrl ? <AvatarImage src={getSafeImageUrl(myPair.person2.avatarUrl) || myPair.person2.avatarUrl} alt={myPair.person2.name} /> : null}
                    <AvatarFallback className="bg-info/10 text-info text-lg font-bold">{myPair.person2.avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-[13px] font-semibold text-foreground">{myPair.person2.name}</p>
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-[20px] font-bold text-foreground tabular-nums">
                  {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
                </span>
                <span className="text-[12px] text-muted-foreground">/ 30:00 remaining</span>
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden max-w-xs mx-auto mb-6">
                <div className="h-full rounded-full bg-gradient-to-r from-info/80 to-info transition-all duration-700"
                  style={{ width: `${((30 * 60 - chatSecondsRemaining) / (30 * 60)) * 100}%` }} />
              </div>

              {/* Topic */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 max-w-md mx-auto mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('gamePlay.coffeeRoulette.needATopic')}</p>
                <p
                  className={cn(
                    'text-[13px] text-foreground leading-relaxed',
                    isSpinningTopic && 'font-semibold',
                  )}
                >
                  “{displayTopic || myPair.topic}”
                </p>
                <div className="flex justify-center pt-3">
                  <Button
                    variant="outline"
                    className="h-9 px-4 text-[12px] gap-2 rounded-xl"
                    disabled={isSpinningTopic}
                    onClick={() => {
                      if (isSpinningTopic) return;
                      setIsSpinningTopic(true);

                      // Emit exactly once
                      onEmitAction('coffee:next_prompt', {});

                      // Slot-machine style spin for ~700ms, then settle to server value.
                      const start = Date.now();
                      if (topicSpinTimerRef.current) {
                        window.clearInterval(topicSpinTimerRef.current);
                        topicSpinTimerRef.current = null;
                      }
                      topicSpinTimerRef.current = window.setInterval(() => {
                        const elapsed = Date.now() - start;
                        if (elapsed >= 700) {
                          if (topicSpinTimerRef.current) {
                            window.clearInterval(topicSpinTimerRef.current);
                            topicSpinTimerRef.current = null;
                          }
                          setIsSpinningTopic(false);
                          // Once snapshot updates, effect will sync; for safety, set immediately too.
                          setDisplayTopic(myPair.topic);
                          return;
                        }
                        const idx = Math.floor(Math.random() * spinTopicPool.length);
                        setDisplayTopic(spinTopicPool[idx]);
                      }, 55);
                    }}
                  >
                    <Shuffle className="h-4 w-4" />
                    {isSpinningTopic
                      ? t('gamePlay.coffeeRoulette.spinning')
                      : t('gamePlay.coffeeRoulette.nextPrompt')}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {t('gamePlay.coffeeRoulette.promptCounter', {
                    current: Math.min(promptsUsed || 0, 6),
                    total: 6,
                  })}
                </p>
              </div>

              <Button onClick={endSession} variant="outline" className="h-10 px-6 text-[13px] gap-2 rounded-xl">
                <CheckCircle className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.endChat')}
              </Button>
              <div className="pt-3">
                <Button onClick={endAndFinishSession} variant="destructive" className="h-10 px-6 text-[13px] gap-2 rounded-xl">
                  <CheckCircle className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.endAndClose')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHATTING — Unpaired spectator (odd participant count) */}
      {phase === 'chatting' && !myPair && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="relative p-8 sm:p-10 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-info/5 to-transparent" />
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10 mx-auto mb-4 ring-4 ring-info/5">
                <Users className="h-8 w-8 text-info" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t('gamePlay.coffeeRoulette.spectatorTitle')}
              </h3>
              <p className="text-[13px] text-muted-foreground max-w-sm mx-auto mb-4">
                {t('gamePlay.coffeeRoulette.spectatorMessage')}
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-[20px] font-bold text-foreground tabular-nums">
                  {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
                </span>
                <span className="text-[12px] text-muted-foreground">/ 30:00 remaining</span>
              </div>
              <Button onClick={endSession} variant="outline" className="h-10 px-6 text-[13px] gap-2 rounded-xl">
                <CheckCircle className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.endChat')}
              </Button>
              <div className="pt-3">
                <Button onClick={endAndFinishSession} variant="destructive" className="h-10 px-6 text-[13px] gap-2 rounded-xl">
                  <CheckCircle className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.endAndClose')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {phase === 'complete' && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in">
          <div className="relative p-8 sm:p-10 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-success/5 to-transparent" />
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-success/20 to-success/5 mx-auto mb-5 ring-4 ring-success/10">
                <Heart className="h-9 w-9 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t('gamePlay.coffeeRoulette.greatConnection')}</h3>
              <p className="text-[13px] text-muted-foreground mb-4 max-w-md mx-auto">
                {t('gamePlay.coffeeRoulette.chattedFor', { minutes: chatMinutesElapsed })}
              </p>
              <div className="flex items-center justify-center gap-3 mb-6">
                <Badge variant="outline" className="text-[11px] gap-1 bg-success/5 border-success/20 text-success">
                  <CheckCircle className="h-3 w-3" /> {t('gamePlay.coffeeRoulette.connectionMade')}
                </Badge>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="lg" className="h-11 text-[13px] gap-2 rounded-xl"
                  onClick={() => { onEmitAction('coffee:reset', {}); setChatSecondsRemaining(30 * 60); capturedElapsedRef.current = 0; }}>
                  <Shuffle className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.newPairing')}
                </Button>
                <Button
                  variant="brand"
                  size="lg"
                  className="h-11 text-[13px] gap-2"
                  onClick={() => window.history.back()}
                >
                  <ArrowRight className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.backToEvents')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
