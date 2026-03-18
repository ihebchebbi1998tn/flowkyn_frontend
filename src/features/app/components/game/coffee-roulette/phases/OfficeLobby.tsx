/**
 * Coffee Roulette - Office Lobby (Redesigned)
 * Professional, compact waiting phase
 * Minimized height, better participant display, beautiful pair visualization
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coffee, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useRoomTheme, useThemeVariables } from '../theme/RoomThemeContext';

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

  return (
    <div style={themeVars as React.CSSProperties}>
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: `linear-gradient(135deg, var(--color-background) 0%, var(--color-surface) 100%)`,
        }}
      >
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 border-b"
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
                    {t('gamePlay.coffeeRoulette.lobby.title', { defaultValue: 'Coffee Roulette' })}
                  </h1>
                  <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.subtitle', {
                      defaultValue: 'Random 1-on-1 coffee chats',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="px-4 py-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-light)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.participants', { defaultValue: 'Participants' })}
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {participantCount}
                  </p>
                </div>

                <div
                  className="px-4 py-2 rounded-lg text-center"
                  style={{
                    backgroundColor: 'var(--color-accent-light)',
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-light)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.pairs', { defaultValue: 'Pairs' })}
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                    {possiblePairs}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-6xl">
            {/* All Participants - Horizontal Scroll */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                {t('gamePlay.coffeeRoulette.lobby.participants', { defaultValue: 'Participants' })} ({participantCount})
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {participants.map((participant, idx) => (
                  <motion.div
                    key={participant.participantId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="flex-shrink-0"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="w-14 h-14 ring-2 ring-offset-1" style={{ borderColor: 'var(--color-primary)' }}>
                        <AvatarImage
                          src={getSafeImageUrl(participant.avatarUrl)}
                          alt={participant.name}
                        />
                        <AvatarFallback
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '700',
                          }}
                        >
                          {participant.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium text-center max-w-[60px] truncate" style={{ color: 'var(--color-text)' }}>
                        {participant.name}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Possible Pairs - Beautiful Room-like Cards */}
            {possiblePairCombos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  {t('gamePlay.coffeeRoulette.lobby.possiblePairs', { defaultValue: 'Possible Pairings' })} ({possiblePairs})
                </p>

                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))` }}>
                  {possiblePairCombos.map((pair, idx) => (
                    <motion.div
                      key={`pair-${idx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                      onMouseEnter={() => setHoveredPairIndex(idx)}
                      onMouseLeave={() => setHoveredPairIndex(null)}
                      className="transition-all duration-200"
                    >
                      <div
                        className={cn(
                          'p-4 rounded-xl flex items-center justify-between transition-all',
                          hoveredPairIndex === idx
                            ? 'shadow-lg scale-105'
                            : 'shadow-md'
                        )}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: `2px solid ${
                            hoveredPairIndex === idx
                              ? 'var(--color-primary)'
                              : 'var(--color-primary-light)'
                          }`,
                        }}
                      >
                        {/* Person 1 */}
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="w-12 h-12 ring-2" style={{ borderColor: 'var(--color-primary)' }}>
                            <AvatarImage
                              src={getSafeImageUrl(pair.person1.avatarUrl)}
                              alt={pair.person1.name}
                            />
                            <AvatarFallback
                              style={{
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '700',
                              }}
                            >
                              {pair.person1.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                              {pair.person1.name}
                            </p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <motion.div
                          animate={hoveredPairIndex === idx ? { x: [0, 3, 0] } : {}}
                          transition={hoveredPairIndex === idx ? { duration: 1, repeat: Infinity } : {}}
                          className="px-2"
                        >
                          <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                        </motion.div>

                        {/* Person 2 */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                              {pair.person2.name}
                            </p>
                          </div>
                          <Avatar className="w-12 h-12 ring-2" style={{ borderColor: 'var(--color-primary)' }}>
                            <AvatarImage
                              src={getSafeImageUrl(pair.person2.avatarUrl)}
                              alt={pair.person2.name}
                            />
                            <AvatarFallback
                              style={{
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '700',
                              }}
                            >
                              {pair.person2.avatar}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Status Message */}
            {!canStart && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 p-4 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--color-surface-light)',
                  border: `1px solid var(--color-primary-light)`,
                }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {t('gamePlay.coffeeRoulette.lobby.needMore', {
                    defaultValue: `Waiting for ${2 - participantCount} more participant${2 - participantCount !== 1 ? 's' : ''}...`,
                  })}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="px-6 py-4 border-t"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'var(--color-primary-light)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-7xl mx-auto flex justify-center">
            <Button
              onClick={onStartMatching}
              disabled={!canStart || isLoading}
              size="lg"
              className="px-8 py-3 text-base font-semibold rounded-lg"
              style={{
                backgroundColor: canStart ? 'var(--color-primary)' : 'var(--color-surface)',
                color: 'white',
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('gamePlay.coffeeRoulette.lobby.starting', { defaultValue: 'Starting...' })}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  {t('gamePlay.coffeeRoulette.lobby.start', {
                    defaultValue: 'Start Coffee Roulette',
                  })}
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
