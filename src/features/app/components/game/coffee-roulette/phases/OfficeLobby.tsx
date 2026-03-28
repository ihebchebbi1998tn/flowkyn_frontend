/**
 * Coffee Roulette - Office Lobby
 * Discord × Linear dark aesthetic with constellation orbit pair visualization
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coffee, Users, Clock, Mic, Sparkles, Shuffle } from 'lucide-react';
import coffeeRouletteGameImg from '@/assets/games/coffee-roulette.jpg';
import { playChatBubblePop } from '@/features/app/components/game/shared/audio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import coffeeRouletteBg from '@/assets/coffee-roulette-bg.jpg';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useThemeVariables } from '../theme/RoomThemeContext';
import { GameActionButton } from '../../shared';
import { ConstellationView, type ChatBubble } from './ConstellationView';
import type { EventsSocketLike, ChatMessagePayload } from '@/features/app/types/socket';

interface Participant {
  participantId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
}

interface OfficeLobbyProps {
  participants: Participant[];
  onStartMatching: () => void;
  isLoading?: boolean;
  /** Events socket for listening to chat messages */
  eventsSocket?: EventsSocketLike;
}

export function OfficeLobby({ participants, onStartMatching, isLoading = false, eventsSocket }: OfficeLobbyProps) {
  const { t } = useTranslation();
  const themeVars = useThemeVariables();
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);

  // Listen for chat messages and show as bubbles
  useEffect(() => {
    if (!eventsSocket?.isConnected) return;

    const unsub = eventsSocket.on('chat:message', (...args: unknown[]) => {
      const data = args[0] as ChatMessagePayload | undefined;
      const participantId = data?.participantId;
      const message = data?.message;
      if (!participantId || !message) return;

      const id = data.id || `bubble-${Date.now()}-${Math.random()}`;
      const bubble: ChatBubble = {
        id,
        participantId,
        message: typeof message === 'string' ? message.slice(0, 100) : '',
        senderName: data.senderName || '',
      };

      setChatBubbles(prev => {
        const filtered = prev.filter(b => b.participantId !== participantId);
        return [...filtered, bubble].slice(-3);
      });
      playChatBubblePop();

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setChatBubbles(prev => prev.filter(b => b.id !== id));
      }, 5000);
    });

    return () => { if (typeof unsub === 'function') unsub(); };
  }, [eventsSocket?.isConnected]);

  const participantCount = participants.length;
  const canStart = participantCount >= 2;
  const missingParticipantsToStart = Math.max(0, 2 - participantCount);
  const possiblePairs = Math.floor(participantCount / 2);

  return (
    <div
      style={themeVars as React.CSSProperties}
      className="h-full min-h-0 flex flex-col bg-background"
    >
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 py-3 border-b border-border/60 bg-card/80 backdrop-blur-md shrink-0"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl border border-border/60 overflow-hidden shrink-0">
                <img src={coffeeRouletteGameImg} alt="Coffee Roulette" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground tracking-tight">
                  {t('gamePlay.coffeeRoulette.lobby.title')}
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  {t('gamePlay.coffeeRoulette.lobby.subtitle')}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-[10px] py-0 border-border/60 bg-muted/20">
                <Clock className="w-2.5 h-2.5" />
                {t('gamePlay.coffeeRoulette.minutes', { defaultValue: '30 min' })}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px] py-0 border-border/60 bg-muted/20">
                <Mic className="w-2.5 h-2.5" />
                {t('gamePlay.coffeeRoulette.lobby.voiceEnabled', { defaultValue: 'Voice' })}
              </Badge>
              {canStart ? (
                <Badge variant="outline" className="gap-1 text-[10px] py-0 border-success/30 bg-success/5 text-success">
                  <Sparkles className="w-2.5 h-2.5" />
                  {t('gamePlay.coffeeRoulette.lobby.ready')}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 text-xs font-semibold py-1 px-3 border-warning/40 bg-warning/15 text-warning shadow-sm">
                  <Users className="w-3 h-3" />
                  {t('gamePlay.coffeeRoulette.lobby.needMore', { count: missingParticipantsToStart })}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0">

            {/* ── Constellation Center ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center p-6 relative min-h-0 overflow-hidden rounded-xl"
            >
              {/* Room background — only in constellation area */}
              <div
                className="absolute inset-[-20%] bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${coffeeRouletteBg})` }}
              />
              <div className="absolute inset-0 bg-background/20" />

              {participantCount > 0 ? (
                <ConstellationView participants={participants} size={380} chatBubbles={chatBubbles} />
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-16 w-16 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center"
                  >
                    <Coffee className="h-7 w-7 text-muted-foreground/60" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('gamePlay.coffeeRoulette.lobby.waitingFor')}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      Participants will appear in the constellation
                    </p>
                  </div>
                </div>
              )}

              {/* Stats overlay — bottom of constellation area */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mt-4"
              >
                {[
                  { icon: Users, label: t('gamePlay.coffeeRoulette.lobby.participants'), value: participantCount, accent: 'primary' },
                  { icon: Shuffle, label: t('gamePlay.coffeeRoulette.lobby.pairs'), value: possiblePairs, accent: 'success' },
                ].map(({ icon: Icon, label, value, accent }) => (
                  <div
                    key={label}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2 rounded-lg border',
                      accent === 'primary'
                        ? 'bg-primary/5 border-primary/15'
                        : 'bg-success/5 border-success/15'
                    )}
                  >
                    <Icon className={cn('w-3.5 h-3.5', accent === 'primary' ? 'text-primary' : 'text-success')} />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
                      <p className={cn(
                        'text-lg font-bold leading-none',
                        accent === 'primary' ? 'text-primary' : 'text-success'
                      )}>{value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Sidebar: Participant List ── */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="border-l border-border/50 bg-card/40 flex flex-col min-h-0"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <h3 className="text-[12px] font-semibold text-foreground">
                    {t('gamePlay.coffeeRoulette.lobby.participants')}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {participantCount}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
                <div className="space-y-0.5">
                  {participants.map((participant, idx) => (
                    <motion.div
                      key={participant.participantId}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className="relative">
                        <Avatar className="h-7 w-7 ring-1 ring-border/50 group-hover:ring-primary/30 transition-all">
                          <AvatarImage src={getSafeImageUrl(participant.avatarUrl)} alt={participant.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                            {participant.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border-2 border-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {participant.name}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {participantCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <p className="text-[11px] text-muted-foreground/60">
                        {t('gamePlay.coffeeRoulette.lobby.waitingFor')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Bottom Action Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="px-5 py-2.5 border-t border-border/60 bg-card/80 backdrop-blur-md shrink-0"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground">
              {canStart ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  {t('gamePlay.coffeeRoulette.lobby.ready')}
                  {' — '}{possiblePairs} {t('gamePlay.coffeeRoulette.lobby.pairs').toLowerCase()}
                </span>
              ) : (
                <span>{t('gamePlay.coffeeRoulette.lobby.needMore', { count: missingParticipantsToStart })}</span>
              )}
            </div>
            <GameActionButton
              onClick={onStartMatching}
              disabled={!canStart || isLoading}
              size="lg"
              className={cn(
                'text-xs font-semibold gap-2 px-5',
                canStart
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {t('gamePlay.coffeeRoulette.lobby.starting')}
                </>
              ) : (
                <>
                  <Coffee className="w-3.5 h-3.5" />
                  {t('gamePlay.coffeeRoulette.lobby.start')}
                </>
              )}
            </GameActionButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
