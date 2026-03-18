/**
 * Coffee Roulette - Meeting Room (Redesigned)
 * Professional, compact, beautiful meeting interface
 * Minimizes scrolling with optimized layout
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Lightbulb, RotateCcw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useRoomTheme, useThemeVariables } from '../theme/RoomThemeContext';

interface Person {
  participantId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
}

interface MeetingRoomProps {
  person1: Person;
  person2: Person;
  topic: string;
  timeRemaining: number;
  promptsUsed: number;
  maxPrompts: number;
  decisionRequired?: boolean;
  onNextPrompt?: () => void;
  onContinue?: () => void;
  onEnd?: () => void;
  isLoading?: boolean;
}

export function MeetingRoom({
  person1,
  person2,
  topic,
  timeRemaining,
  promptsUsed,
  maxPrompts,
  decisionRequired = false,
  onNextPrompt,
  onContinue,
  onEnd,
  isLoading = false,
}: MeetingRoomProps) {
  const { t } = useTranslation();
  const themeVars = useThemeVariables();
  const [displayTime, setDisplayTime] = useState(formatTime(timeRemaining));
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    setDisplayTime(formatTime(timeRemaining));
    setIsWarning(timeRemaining < 300);
  }, [timeRemaining]);

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
          className="px-6 py-3 border-b"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'var(--color-primary-light)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Status */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-semibold">
                  {t('gamePlay.coffeeRoulette.chatting.meeting', { defaultValue: 'LIVE' })}
                </span>
              </div>
            </div>

            {/* Center: Timer */}
            <div className="flex items-center gap-2">
              <Clock
                className="w-4 h-4"
                style={{ color: isWarning ? '#ef4444' : 'var(--color-primary)' }}
              />
              <motion.span
                className="font-mono font-bold text-sm"
                style={{ color: isWarning ? '#ef4444' : 'var(--color-primary)' }}
                animate={isWarning ? { scale: [1, 1.1, 1] } : {}}
                transition={isWarning ? { duration: 1, repeat: Infinity } : {}}
              >
                {displayTime}
              </motion.span>
              <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                {t('gamePlay.coffeeRoulette.chatting.promptCounter', {
                  defaultValue: `${promptsUsed}/${maxPrompts}`,
                })}
              </span>
            </div>

            {/* Right: Empty for balance */}
            <div className="w-20" />
          </div>
        </motion.div>

        {/* Main Content - Optimized Layout */}
        <div className="flex-1 flex items-center justify-center px-4 py-4 overflow-y-auto">
          <div className="w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Two-Column Layout: Participants + Topic */}
              <div className="grid grid-cols-2 gap-4 items-center">
                {/* Left: Participants Side-by-Side */}
                <div className="flex flex-col gap-3">
                  {/* Person 1 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      border: `1px solid var(--color-primary-light)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-16 h-16 flex-shrink-0" style={{ outlineWidth: '2px', outlineColor: 'var(--color-primary)', outlineOffset: '2px' }}>
                        <AvatarImage src={getSafeImageUrl(person1.avatarUrl)} alt={person1.name} />
                        <AvatarFallback
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                          }}
                        >
                          {person1.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                          {person1.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                          {t('gamePlay.coffeeRoulette.chatting.participant', { defaultValue: 'Participant' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Person 2 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      border: `1px solid var(--color-primary-light)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-16 h-16 flex-shrink-0" style={{ outlineWidth: '2px', outlineColor: 'var(--color-primary)', outlineOffset: '2px' }}>
                        <AvatarImage src={getSafeImageUrl(person2.avatarUrl)} alt={person2.name} />
                        <AvatarFallback
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '700',
                          }}
                        >
                          {person2.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                          {person2.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                          {t('gamePlay.coffeeRoulette.chatting.participant', { defaultValue: 'Participant' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right: Topic Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="rounded-lg p-4 flex flex-col justify-between h-full"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: `2px solid var(--color-primary)`,
                    boxShadow: '0 8px 24px rgba(108, 92, 231, 0.12)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                        {t('gamePlay.coffeeRoulette.chatting.todaysTopic', { defaultValue: 'Topic' })}
                      </p>
                    </div>
                    <motion.p
                      key={topic}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-base font-semibold leading-relaxed"
                      style={{ color: 'var(--color-text)' }}
                    >
                      "{topic}"
                    </motion.p>
                  </div>

                  {/* Decision Message */}
                  {decisionRequired && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 pt-3 border-t"
                      style={{ borderColor: 'var(--color-primary-light)' }}
                    >
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                        ✓ {t('gamePlay.coffeeRoulette.chatting.timeToDecide', { defaultValue: 'Time to decide!' })}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Compact Action Buttons - Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="px-6 py-3 border-t"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'var(--color-primary-light)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 flex-wrap justify-center">
              {onNextPrompt && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onNextPrompt}
                    disabled={isLoading}
                    className="gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all text-white"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      border: 'none',
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {t('gamePlay.coffeeRoulette.chatting.nextPrompt', { defaultValue: 'Next' })}
                  </Button>
                </motion.div>
              )}

              {onContinue && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onContinue}
                    disabled={isLoading}
                    className="gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all"
                    variant="outline"
                    style={{
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)',
                      borderWidth: '1px',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('gamePlay.coffeeRoulette.chatting.continue', { defaultValue: 'Continue' })}
                  </Button>
                </motion.div>
              )}

              {onEnd && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onEnd}
                    disabled={isLoading}
                    className="gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all text-white"
                    style={{
                      backgroundColor: '#ef4444',
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t('gamePlay.coffeeRoulette.chatting.end', { defaultValue: 'End' })}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
