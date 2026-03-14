import { useState, useCallback, useEffect } from 'react';
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
import { GAME_TYPES } from '@/features/app/pages/play/GamePlay';

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

  // Initialize from server timestamp so late-joiners see the correct remaining time
  const [chatSecondsRemaining, setChatSecondsRemaining] = useState(() => {
    if (chatEndsAt) {
      return Math.max(0, Math.ceil((new Date(chatEndsAt).getTime() - Date.now()) / 1000));
    }
    return 30 * 60;
  });
  const [showCountdown, setShowCountdown] = useState(false);

  const startMatching = () => {
    setShowCountdown(true);
  };

  const handleCountdownDone = useCallback(() => {
    setShowCountdown(false);
    onEmitAction('coffee:shuffle', {});
  }, [onEmitAction]);

  const startChatting = () => {
    onEmitAction('coffee:start_chat', {});
  };

  const endSession = () => {
    onEmitAction('coffee:end', {});
  };

  useEffect(() => {
    if (phase !== 'chatting' || !chatEndsAt) {
      if (phase !== 'chatting') setChatSecondsRemaining(30 * 60);
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
  }, [phase, chatEndsAt]);

  const displayMinutes = Math.floor(chatSecondsRemaining / 60);
  const displaySeconds = chatSecondsRemaining % 60;
  const chatMinutesElapsed = Math.floor((30 * 60 - chatSecondsRemaining) / 60);

  return (
    <div className="space-y-4">
      <CountdownOverlay active={showCountdown} onComplete={handleCountdownDone} accentColor="info" finalText="MATCH!" />
      {/* Phase header */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <Coffee className="h-5 w-5 text-info" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.coffeeRoulette.title')}</h3>
                <p className="text-[11px] text-muted-foreground">{t('gamePlay.coffeeRoulette.subtitle')}</p>
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
                   ? t('gamePlay.coffeeRoulette.waitingForOthers', 'Waiting for teammates...')
                   : t('gamePlay.coffeeRoulette.readyToConnect')}
               </h3>
              <p className="text-[13px] text-muted-foreground mb-3 max-w-md mx-auto leading-relaxed">
                {participants.length < 2
                  ? t('gamePlay.coffeeRoulette.needMoreParticipants', 'We need at least 2 people to start this connection session. Share the invite link to get started as a team!')
                  : t('gamePlay.coffeeRoulette.description')}
              </p>
              <div className="flex items-center justify-center gap-4 mb-8 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t('gamePlay.coffeeRoulette.minutes')}</span>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {participants.length} {t('analyticsPage.participants')}</span>
              </div>
              <Button variant="brand" onClick={startMatching} disabled={participants.length < 2} size="xl" className="px-10 gap-2.5 shadow-lg shadow-primary/20">
                <Shuffle className="h-5 w-5" /> {participants.length < 2 ? t('gamePlay.coffeeRoulette.waitingForTeam', 'Waiting for more teammates...') : t('gamePlay.coffeeRoulette.shuffleMatch')}
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
                <h3 className="text-[14px] font-semibold text-foreground">{t('gamePlay.coffeeRoulette.pairsSet')}</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {pairs.map((pair, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  key={pair.id} 
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-colors",
                    i === 0 ? 'border-info/30 bg-info/[0.04] ring-2 ring-info/10' : 'border-border bg-card'
                  )} 
                >
                  {/* Person 1 */}
                  <motion.div 
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 200 }}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-info/20">
                      {pair.person1.avatarUrl ? <AvatarImage src={getSafeImageUrl(pair.person1.avatarUrl) || pair.person1.avatarUrl} alt={pair.person1.name} /> : null}
                      <AvatarFallback className="bg-info/10 text-info text-[11px] font-bold">{pair.person1.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-medium text-foreground truncate">{pair.person1.name}</span>
                  </motion.div>

                  {/* Connector */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.15 + 0.4, type: 'spring' }}
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    <div className="h-px w-4 bg-border" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
                      <Coffee className="h-3.5 w-3.5 text-info" />
                    </div>
                    <div className="h-px w-4 bg-border" />
                  </motion.div>

                  {/* Person 2 */}
                  <motion.div 
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 200 }}
                    className="flex items-center gap-2 flex-1 min-w-0 justify-end"
                  >
                    <span className="text-[13px] font-medium text-foreground truncate">{pair.person2.name}</span>
                    <Avatar className="h-10 w-10 ring-2 ring-info/20">
                      {pair.person2.avatarUrl ? <AvatarImage src={getSafeImageUrl(pair.person2.avatarUrl) || pair.person2.avatarUrl} alt={pair.person2.name} /> : null}
                      <AvatarFallback className="bg-info/10 text-info text-[11px] font-bold">{pair.person2.avatar}</AvatarFallback>
                    </Avatar>
                  </motion.div>

                  {(pair.person1.participantId === currentUserId || pair.person2.participantId === currentUserId) && (
                    <Badge className="text-[9px] bg-info/15 text-info border-info/25 shrink-0">{t('gamePlay.coffeeRoulette.you')}</Badge>
                  )}
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
                <p className="text-[11px] font-semibold text-info uppercase tracking-wider mb-1">{t('gamePlay.coffeeRoulette.conversationStarter')}</p>
                <p className="text-[14px] text-foreground font-medium leading-relaxed">"{myPair?.topic || pairs[0]?.topic}"</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button variant="brand" onClick={startChatting} size="xl" className="px-10 gap-2.5 shadow-lg shadow-primary/20">
              <MessageCircle className="h-5 w-5" /> {t('gamePlay.coffeeRoulette.startChatting')}
            </Button>
          </div>
        </div>
      )}

      {/* CHATTING — Active session */}
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
                <p className="text-[13px] text-foreground leading-relaxed">"{myPair.topic}"</p>
              </div>

              <Button onClick={endSession} variant="outline" className="h-10 px-6 text-[13px] gap-2 rounded-xl">
                <CheckCircle className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.endChat')}
              </Button>
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
                  onClick={() => { onEmitAction('coffee:reset', {}); setChatSecondsRemaining(30 * 60); }}>
                  <Shuffle className="h-4 w-4" /> {t('gamePlay.coffeeRoulette.newPairing')}
                </Button>
                <Button variant="brand" size="lg" className="h-11 text-[13px] gap-2">
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
