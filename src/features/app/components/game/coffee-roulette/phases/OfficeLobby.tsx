/**
 * Coffee Roulette - Office Lobby (Redesigned)
 * Professional, compact waiting phase
 * Minimized height, better participant display, beautiful pair visualization
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coffee, Users, ArrowRight, User, Clock, Mic } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useRoomTheme, useThemeVariables } from '../theme/RoomThemeContext';
import { GameActionButton } from '../../shared';

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
}

export function OfficeLobby({ participants, onStartMatching, isLoading = false }: OfficeLobbyProps) {
  const { t } = useTranslation();
  const themeVars = useThemeVariables();
  const [hoveredPairIndex, setHoveredPairIndex] = useState<number | null>(null);

  const participantCount = participants.length;
  const canStart = participantCount >= 2;
  const missingParticipantsToStart = Math.max(0, 2 - participantCount);
  const possiblePairs = Math.floor(participantCount / 2);

  // Generate possible pair combinations for visualization
  const possiblePairCombos = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < participantCount - 1; i += 2) {
      if (participants[i + 1]) {
        pairs.push({
          index: i,
          person1: participants[i],
          person2: participants[i + 1],
        });
      }
    }
    return pairs;
  }, [participants, participantCount]);

  const avatarFallback = (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
    >
      <User className="w-4 h-4" />
    </div>
  );

  return (
    <div
      style={themeVars as React.CSSProperties}
      className="h-full min-h-0 flex flex-col"
    >
      <div
        className="h-full flex flex-col min-h-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-background) 0%, var(--color-surface) 100%)`,
        }}
      >
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2.5 border-b"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'var(--color-primary-light)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coffee className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.title')}
                  </h1>
                  <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="px-4 py-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    border: '1px solid var(--color-primary-light)',
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.participants')}
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {participantCount}
                  </p>
                </div>

                <div
                  className="px-4 py-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'var(--color-accent-light)',
                    border: '1px solid var(--color-accent-light)',
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.pairs')}
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {possiblePairs}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-white/50"
                style={{ borderColor: 'var(--color-primary-light)' }}
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                  {t('gamePlay.coffeeRoulette.minutes', { defaultValue: '30 minutes' })}
                </span>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-white/50"
                style={{ borderColor: 'var(--color-accent-light)' }}
              >
                <Mic className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                  {t('gamePlay.coffeeRoulette.lobby.voiceEnabled', { defaultValue: 'Voice chat' })}
                </span>
              </div>
              {!canStart && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-white/50"
                  style={{ borderColor: 'var(--color-primary-light)' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.needMore', { count: missingParticipantsToStart })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-4 min-h-0 overflow-hidden">
          <div className="w-full max-w-6xl mx-auto h-full min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch h-full min-h-0 overflow-hidden">
              {/* Participants */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-border/60 bg-white/60 shadow-sm flex flex-col min-h-0 h-full"
                style={{ padding: 16 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                      {t('gamePlay.coffeeRoulette.lobby.participants')}
                    </p>
                  </div>
                  <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
                    {participantCount}
                  </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: 6 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {participants.map((participant, idx) => (
                      <motion.div
                        key={participant.participantId}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: idx * 0.01 }}
                        title={participant.name}
                        className="flex items-center justify-center"
                      >
                        <Avatar
                          className="w-9 h-9 ring-1"
                          style={{
                            outlineWidth: '1px',
                            outlineColor: 'var(--color-primary)',
                            outlineOffset: '2px',
                          }}
                        >
                          <AvatarImage
                            src={getSafeImageUrl(participant.avatarUrl)}
                            alt={participant.name}
                          />
                          <AvatarFallback
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '700',
                            }}
                          >
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Possible pairs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="rounded-2xl border border-border/60 bg-white/60 shadow-sm flex flex-col min-h-0 h-full"
                style={{ padding: 16 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                      {t('gamePlay.coffeeRoulette.lobby.pairs')}
                    </p>
                  </div>
                  <p className="text-base font-bold" style={{ color: 'var(--color-accent)' }}>
                    {possiblePairs}
                  </p>
                </div>

                {possiblePairCombos.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.waitingFor')}
                  </p>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingRight: 6 }}>
                    <div
                      className="grid gap-3"
                      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(230px, 1fr))` }}
                    >
                      {possiblePairCombos.map((pair, idx) => (
                        <motion.div
                          key={`pair-${idx}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, delay: 0.02 + idx * 0.01 }}
                          onMouseEnter={() => setHoveredPairIndex(idx)}
                          onMouseLeave={() => setHoveredPairIndex(null)}
                          className="transition-all duration-200"
                        >
                          <div
                            className={cn(
                              'p-3 rounded-xl flex items-center justify-between transition-all',
                              hoveredPairIndex === idx ? 'shadow-md scale-105' : 'shadow-sm'
                            )}
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: `2px solid ${
                                hoveredPairIndex === idx ? 'var(--color-primary)' : 'var(--color-primary-light)'
                              }`,
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Avatar
                                className="w-10 h-10 ring-1"
                                style={{
                                  outlineWidth: '1px',
                                  outlineColor: 'var(--color-primary)',
                                  outlineOffset: '2px',
                                }}
                              >
                                <AvatarImage
                                  src={getSafeImageUrl(pair.person1.avatarUrl)}
                                  alt={pair.person1.name}
                                />
                                <AvatarFallback
                                  style={{
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                  }}
                                >
                                  {avatarFallback}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                  {pair.person1.name}
                                </p>
                              </div>
                            </div>

                            <motion.div
                              animate={hoveredPairIndex === idx ? { x: [0, 3, 0] } : {}}
                              transition={hoveredPairIndex === idx ? { duration: 1, repeat: Infinity } : {}}
                              className="px-2"
                            >
                              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                            </motion.div>

                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <div className="flex-1 min-w-0 text-right">
                                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                                  {pair.person2.name}
                                </p>
                              </div>
                              <Avatar
                                className="w-10 h-10 ring-1"
                                style={{
                                  outlineWidth: '1px',
                                  outlineColor: 'var(--color-primary)',
                                  outlineOffset: '2px',
                                }}
                              >
                                <AvatarImage
                                  src={getSafeImageUrl(pair.person2.avatarUrl)}
                                  alt={pair.person2.name}
                                />
                                <AvatarFallback
                                  style={{
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                  }}
                                >
                                  {avatarFallback}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Status */}
              <div className="lg:col-span-2">
                {!canStart ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 p-4 rounded-2xl text-center"
                    style={{
                      backgroundColor: 'var(--color-surface-light)',
                      border: `1px solid var(--color-primary-light)`,
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {t('gamePlay.coffeeRoulette.lobby.needMore', { count: missingParticipantsToStart })}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 p-4 rounded-2xl text-center"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      border: `1px solid var(--color-primary-light)`,
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {t('gamePlay.coffeeRoulette.lobby.ready')}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="px-5 py-3 border-t flex-shrink-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'var(--color-primary-light)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-7xl mx-auto flex justify-center">
            <GameActionButton
              onClick={onStartMatching}
              disabled={!canStart || isLoading}
              size="lg"
              className="text-sm font-semibold"
              style={{
                backgroundColor: canStart ? 'var(--color-primary)' : 'var(--color-surface)',
                color: 'white',
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('gamePlay.coffeeRoulette.lobby.starting')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  {t('gamePlay.coffeeRoulette.lobby.start')}
                </div>
              )}
            </GameActionButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
