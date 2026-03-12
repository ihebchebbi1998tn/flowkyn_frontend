import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Coffee, Shuffle, MessageCircle, Clock, Users,
  Zap, CheckCircle, ArrowRight, Sparkles, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PhaseBadge, CountdownOverlay, type GamePhase } from '../shared';

interface Pair {
  id: string;
  person1: { name: string; avatar: string };
  person2: { name: string; avatar: string };
  topic: string;
}

const CONVERSATION_STARTERS = [
  "What's the most interesting thing you've learned recently?",
  "If you could have dinner with anyone (alive or dead), who would it be?",
  "What's a hobby or skill you'd love to pick up?",
  "What was your first job? What did you learn from it?",
  "If you could live anywhere in the world for a year, where would you go?",
  "What's the best piece of advice you've ever received?",
  "What's a book or movie that completely changed your perspective?",
  "If you had to eat one meal for the rest of your life, what would it be?",
  "What's the most spontaneous thing you've ever done?",
  "Which fictional character do you relate to the most?",
  "What's something you're surprisingly good at?",
];

export interface CoffeeRouletteBoardProps {
  participants: any[];
  currentUserId: string;
}

export function CoffeeRouletteBoard({ participants, currentUserId }: CoffeeRouletteBoardProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [myPair, setMyPair] = useState<Pair | null>(null);
  const [chatMinutes, setChatMinutes] = useState(0);
  const [currentStarter, setCurrentStarter] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);

  const shufflePairs = () => {
    setIsShuffling(true);
    // Simulate shuffle animation
    let count = 0;
    const interval = setInterval(() => {
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const newPairs: Pair[] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          newPairs.push({
            id: String(i),
            person1: { name: shuffled[i].name, avatar: shuffled[i].avatar },
            person2: { name: shuffled[i+1].name, avatar: shuffled[i+1].avatar },
            topic: CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)],
          });
        }
      }
      setPairs(newPairs);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        setIsShuffling(false);
      }
    }, 150);
  };

  const startMatching = () => {
    setShowCountdown(true);
  };

  const handleCountdownDone = useCallback(() => {
    setShowCountdown(false);
    shufflePairs();
    setTimeout(() => {
      setPhase('matching');
      setMyPair(pairs[0]);
    }, 1500);
  }, [pairs]);

  const startChatting = () => {
    setPhase('chatting');
    // Simulate chat timer
    const interval = setInterval(() => {
      setChatMinutes(prev => {
        if (prev >= 30) { clearInterval(interval); return 30; }
        return prev + 1;
      });
    }, 2000); // Accelerated for demo
  };

  const endSession = () => {
    setPhase('complete');
  };

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
                 {participants.length < 2 ? t('gamePlay.coffeeRoulette.waitingForOthers', 'Waiting for others...') : t('gamePlay.coffeeRoulette.readyToConnect')}
               </h3>
              <p className="text-[13px] text-muted-foreground mb-3 max-w-md mx-auto leading-relaxed">
                {participants.length < 2 
                  ? t('gamePlay.coffeeRoulette.needMorePlayers', 'We need at least 2 people to start the roulette. Share the invite link to get started!') 
                  : t('gamePlay.coffeeRoulette.description')}
              </p>
              <div className="flex items-center justify-center gap-4 mb-8 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t('gamePlay.coffeeRoulette.minutes')}</span>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {participants.length} {t('analyticsPage.participants')}</span>
              </div>
              <Button variant="brand" onClick={startMatching} disabled={participants.length < 2} size="xl" className="px-10 gap-2.5 shadow-lg shadow-primary/20">
                <Shuffle className="h-5 w-5" /> {participants.length < 2 ? 'Waiting for more players...' : t('gamePlay.coffeeRoulette.shuffleMatch')}
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
                      <AvatarFallback className="bg-info/10 text-info text-[11px] font-bold">{pair.person2.avatar}</AvatarFallback>
                    </Avatar>
                  </motion.div>

                  {i === 0 && (
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
                <p className="text-[14px] text-foreground font-medium leading-relaxed">"{pairs[0]?.topic}"</p>
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
                    <AvatarFallback className="bg-info/10 text-info text-lg font-bold">{myPair.person2.avatar}</AvatarFallback>
                  </Avatar>
                  <p className="text-[13px] font-semibold text-foreground">{myPair.person2.name}</p>
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-[20px] font-bold text-foreground tabular-nums">{chatMinutes}:00</span>
                <span className="text-[12px] text-muted-foreground">/ 30:00</span>
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden max-w-xs mx-auto mb-6">
                <div className="h-full rounded-full bg-gradient-to-r from-info/80 to-info transition-all duration-700"
                  style={{ width: `${(chatMinutes / 30) * 100}%` }} />
              </div>

              {/* Conversation starters carousel */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 max-w-md mx-auto mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('gamePlay.coffeeRoulette.needATopic')}</p>
                <p className="text-[13px] text-foreground leading-relaxed">"{CONVERSATION_STARTERS[currentStarter]}"</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-[11px] text-info hover:text-info"
                  onClick={() => setCurrentStarter((currentStarter + 1) % CONVERSATION_STARTERS.length)}
                >
                  <Shuffle className="h-3 w-3 mr-1" /> {t('gamePlay.coffeeRoulette.nextTopic')}
                </Button>
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
                {t('gamePlay.coffeeRoulette.chattedFor', { minutes: chatMinutes })}
              </p>
              <div className="flex items-center justify-center gap-3 mb-6">
                <Badge variant="outline" className="text-[11px] gap-1 bg-success/5 border-success/20 text-success">
                  <CheckCircle className="h-3 w-3" /> {t('gamePlay.coffeeRoulette.connectionMade')}
                </Badge>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="lg" className="h-11 text-[13px] gap-2 rounded-xl"
                  onClick={() => { setPhase('waiting'); setChatMinutes(0); }}>
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
