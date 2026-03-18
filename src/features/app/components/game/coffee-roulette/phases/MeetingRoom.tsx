/**
 * Coffee Roulette - Meeting Room (Redesigned)
 * Professional, modern, compact meeting interface
 * Minimizes scrolling and vibe-coded elements
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Lightbulb, RotateCcw, LogOut, Users } from 'lucide-react';
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
  const { theme } = useRoomTheme();
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
        className="min-h-screen relative flex flex-col"
        style={{
          background: `linear-gradient(135deg, var(--color-background) 0%, var(--color-surface) 100%)`,
        }}
      >
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 px-6 py-3 border-b"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'var(--color-primary-light)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Status */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                }}
              >
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold">
                  {t('gamePlay.coffeeRoulette.chatting.meeting', { defaultValue: 'LIVE' })}
                </span>
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-light)' }}>
                {t('gamePlay.coffeeRoulette.chatting.oneOnOne', { defaultValue: '1-on-1 Conversation' })}
              </span>
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
            </div>

            {/* Right: Progress */}
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-light)' }}>
              {t('gamePlay.coffeeRoulette.chatting.promptCounter', {
                defaultValue: `Prompt ${promptsUsed}/${maxPrompts}`,
              })}
            </span>
          </div>
        </motion.div>

        {/* Main Content - Compact Grid Layout */}
        <div className="flex-1 flex items-center justify-center px-4 py-5 overflow-y-auto">
          <div className="w-full max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-3 gap-5 items-stretch"
            >
              {/* Left Panel: Person 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: `2px solid var(--color-primary-light)`,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="flex flex-col items-center gap-2 h-full justify-between">
                  <Avatar className="w-20 h-20 ring-4 ring-offset-2" style={{ borderColor: 'var(--color-primary)' }}>
                    <AvatarImage src={getSafeImageUrl(person1.avatarUrl)} alt={person1.name} />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '700',
                      }}
                    >
                      {person1.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center w-full">
                    <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                      {person1.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                      {t('gamePlay.coffeeRoulette.chatting.participant', { defaultValue: 'Participant' })}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Center Panel: Topic */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-xl p-5 flex flex-col justify-between"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: `2px solid var(--color-primary)`,
                  boxShadow: '0 15px 40px rgba(108, 92, 231, 0.15)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                      {t('gamePlay.coffeeRoulette.chatting.todaysTopic', { defaultValue: 'Today\'s Topic' })}
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
                      ✓ {t('gamePlay.coffeeRoulette.chatting.timeToDecide', { defaultValue: 'Time to decide what\'s next!' })}
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {/* Right Panel: Person 2 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: `2px solid var(--color-primary-light)`,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="flex flex-col items-center gap-2 h-full justify-between">
                  <Avatar className="w-20 h-20 ring-4 ring-offset-2" style={{ borderColor: 'var(--color-primary)' }}>
                    <AvatarImage src={getSafeImageUrl(person2.avatarUrl)} alt={person2.name} />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '700',
                      }}
                    >
                      {person2.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center w-full">
                    <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                      {person2.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                      {t('gamePlay.coffeeRoulette.chatting.participant', { defaultValue: 'Participant' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Compact Action Buttons - Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-20 px-6 py-3 border-t"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
                    className="gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all text-white"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      border: 'none',
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t('gamePlay.coffeeRoulette.chatting.nextPrompt', { defaultValue: 'New Prompt' })}
                  </Button>
                </motion.div>
              )}

              {onContinue && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onContinue}
                    disabled={isLoading}
                    className="gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                    variant="outline"
                    style={{
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)',
                      borderWidth: '2px',
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('gamePlay.coffeeRoulette.chatting.continue', { defaultValue: 'Continue' })}
                  </Button>
                </motion.div>
              )}

              {onEnd && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onEnd}
                    disabled={isLoading}
                    className="gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                    variant="destructive"
                  >
                    <LogOut className="w-4 h-4" />
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
