/**
 * Coffee Roulette - Office Lobby
 * Phase 1: Waiting Phase
 * Shows participants, join instructions, and "Start Matching" button
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coffee, Users, Zap } from 'lucide-react';
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
  const { theme } = useRoomTheme();
  const themeVars = useThemeVariables();
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);

  const participantCount = participants.length;
  const canStart = participantCount >= 2;

  // Grid layout - responsive participant display
  const columns = useMemo(() => {
    if (participantCount <= 2) return 2;
    if (participantCount <= 6) return 3;
    return 4;
  }, [participantCount]);

  return (
    <div style={themeVars as React.CSSProperties}>
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background: `var(--gradient-room)`,
        }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Building windows effect */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-16 h-20 border-2"
                style={{
                  left: `${(i % 4) * 25}%`,
                  top: `${Math.floor(i / 4) * 25}%`,
                  borderColor: 'var(--color-door)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Coffee className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
              <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--color-text)' }}>
                {t('gamePlay.coffeeRoulette.lobby.title', { defaultValue: 'Office Lobby' })}
              </h1>
              <Zap className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
            </div>

            <p className="text-lg" style={{ color: 'var(--color-text-light)' }}>
              {t('gamePlay.coffeeRoulette.lobby.subtitle', {
                defaultValue: 'Welcome to Coffee Roulette! Random pairing for meaningful conversations.',
              })}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center gap-8 mb-12"
          >
            <div
              className="px-6 py-4 rounded-lg"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderLeft: `4px solid var(--color-primary)`,
              }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.participants', { defaultValue: 'Participants' })}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {participantCount}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="px-6 py-4 rounded-lg"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderLeft: `4px solid var(--color-accent)`,
              }}
            >
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                    {t('gamePlay.coffeeRoulette.lobby.pairs', { defaultValue: 'Possible Pairs' })}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {Math.floor(participantCount / 2)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Participants Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
              {t('gamePlay.coffeeRoulette.lobby.waitingFor', {
                defaultValue: 'Waiting for participants...',
              })}
            </h2>

            <div
              className={cn(
                'gap-4 grid auto-rows-max',
                `grid-cols-${columns}`
              )}
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {participants.map((participant) => (
                <motion.div
                  key={participant.participantId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  onMouseEnter={() => setHoveredParticipant(participant.participantId)}
                  onMouseLeave={() => setHoveredParticipant(null)}
                  className="group cursor-pointer"
                >
                  <div
                    className={cn(
                      'p-4 rounded-lg transition-all duration-300 flex flex-col items-center gap-3',
                      hoveredParticipant === participant.participantId
                        ? 'transform scale-105 shadow-lg'
                        : 'shadow'
                    )}
                    style={{
                      backgroundColor:
                        hoveredParticipant === participant.participantId
                          ? 'var(--color-surface-light)'
                          : 'var(--color-surface)',
                      border: `2px solid ${
                        hoveredParticipant === participant.participantId
                          ? 'var(--color-primary)'
                          : 'transparent'
                      }`,
                    }}
                  >
                    <Avatar className="w-16 h-16 ring-2" style={{ ringColor: 'var(--color-primary)' }}>
                      <AvatarImage
                        src={getSafeImageUrl(participant.avatarUrl)}
                        alt={participant.name}
                      />
                      <AvatarFallback
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                        }}
                      >
                        {participant.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm text-center" style={{ color: 'var(--color-text)' }}>
                      {participant.name}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Empty slots if less than 2 */}
              {participantCount < 2 &&
                [...Array(2 - participantCount)].map((_, i) => (
                  <motion.div
                    key={`empty-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                    className="animate-pulse"
                  >
                    <div
                      className="p-4 rounded-lg flex flex-col items-center gap-3 border-2 border-dashed"
                      style={{
                        backgroundColor: 'var(--color-wall-light)',
                        borderColor: 'var(--color-text-light)',
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-full"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      />
                      <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                        {t('gamePlay.coffeeRoulette.lobby.waiting', { defaultValue: 'Waiting...' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            {!canStart && (
              <Badge variant="outline" className="mb-4">
                {t('gamePlay.coffeeRoulette.lobby.needMore', {
                  defaultValue: `Need ${2 - participantCount} more participants`,
                })}
              </Badge>
            )}

            <Button
              onClick={onStartMatching}
              disabled={!canStart || isLoading}
              size="lg"
              className="px-12 py-6 text-lg font-semibold"
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
                  <Zap className="w-5 h-5" />
                  {t('gamePlay.coffeeRoulette.lobby.start', {
                    defaultValue: 'Start Coffee Roulette',
                  })}
                </div>
              )}
            </Button>

            {canStart && (
              <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                {t('gamePlay.coffeeRoulette.lobby.ready', {
                  defaultValue: 'Ready to create pairs and match everyone!',
                })}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
