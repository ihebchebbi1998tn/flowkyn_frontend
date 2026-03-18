/**
 * Coffee Roulette - Meeting Room
 * Phase 3: Chatting Phase
 * Immersive meeting room with window, seated avatars, prompts, and timer
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
  const { theme } = useRoomTheme();
  const themeVars = useThemeVariables();
  const [displayTime, setDisplayTime] = useState(formatTime(timeRemaining));
  const [isWarning, setIsWarning] = useState(false);

  // Update time display
  useEffect(() => {
    setDisplayTime(formatTime(timeRemaining));
    setIsWarning(timeRemaining < 300); // 5 minutes warning
  }, [timeRemaining]);

  return (
    <div style={themeVars as React.CSSProperties}>
      <div
        className="min-h-screen relative overflow-hidden flex flex-col"
        style={{
          background: `var(--gradient-room)`,
        }}
      >
        {/* Room background with depth */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Parallax window background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.window} 0%, ${theme.colors.background} 100%)`,
              opacity: 0.1,
            }}
          />

          {/* Floor perspective */}
          <div
            className="absolute bottom-0 inset-x-0 h-1/3"
            style={{
              background: `linear-gradient(to bottom, transparent, ${theme.colors.floor})`,
              opacity: 0.15,
            }}
          />
        </div>

        {/* Top bar with theme-based styling */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-20 px-4 py-4 border-b"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderColor: 'var(--color-primary)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle
                className="w-5 h-5"
                style={{ color: 'var(--color-primary)' }}
              />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {t('gamePlay.coffeeRoulette.chatting.inProgress', {
                  defaultValue: 'In Progress',
                })}
              </p>
            </div>

            {/* Timer - Large and prominent */}
            <motion.div
              className={cn(
                'px-4 py-2 rounded-lg font-mono font-bold text-lg',
                isWarning ? 'animate-pulse' : ''
              )}
              style={{
                backgroundColor: isWarning
                  ? 'var(--color-accent)'
                  : 'var(--color-surface)',
                color: isWarning
                  ? 'var(--color-text)'
                  : 'var(--color-primary)',
              }}
              animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
              transition={isWarning ? { duration: 1, repeat: Infinity } : {}}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              {displayTime}
            </motion.div>

            <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
              {t('gamePlay.coffeeRoulette.chatting.prompts', {
                defaultValue: `Prompts: ${promptsUsed}/${maxPrompts}`,
              })}
            </p>
          </div>
        </motion.div>

        {/* Main chat area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4">
          {/* Meeting room container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl relative"
          >
            {/* Window view (background decoration) */}
            <WindowView theme={theme} />

            {/* Room content */}
            <div className="relative z-10 px-6 py-8 rounded-xl backdrop-blur-sm" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: `2px solid var(--color-primary-light)`,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            }}>
              {/* Participants seated */}
              <div className="flex items-end justify-between mb-8">
                {/* Person 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <Avatar className="w-20 h-20 ring-4" style={{ borderColor: 'var(--color-primary)' }}>
                    <AvatarImage
                      src={getSafeImageUrl(person1.avatarUrl)}
                      alt={person1.name}
                    />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '16px',
                      }}
                    >
                      {person1.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-center font-semibold text-xs" style={{ color: 'var(--color-text)' }}>
                    {person1.name}
                  </p>
                </motion.div>

                {/* Cup decoration */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl"
                >
                  ☕
                </motion.div>

                {/* Person 2 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <Avatar className="w-20 h-20 ring-4" style={{ borderColor: 'var(--color-primary)' }}>
                    <AvatarImage
                      src={getSafeImageUrl(person2.avatarUrl)}
                      alt={person2.name}
                    />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '16px',
                      }}
                    >
                      {person2.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-center font-semibold text-xs" style={{ color: 'var(--color-text)' }}>
                    {person2.name}
                  </p>
                </motion.div>
              </div>

              {/* Divider */}
              <div
                className="h-1 my-6 rounded-full bg-gradient-to-r"
                style={{
                  background: `linear-gradient(90deg, transparent, var(--color-primary-light), transparent)`,
                }}
              />

              {/* Prompt Display */}
              <PromptDisplay topic={topic} />
            </div>
          </motion.div>
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-20 px-4 py-6 border-t backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderColor: 'var(--color-primary-light)',
          }}
        >
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {decisionRequired && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-2 rounded-lg border-l-4"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  borderColor: 'var(--color-text)',
                  color: 'var(--color-text)',
                }}
              >
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  {t('gamePlay.coffeeRoulette.chatting.keepTalking', {
                    defaultValue: 'Want to keep talking?',
                  })}
                </p>
              </motion.div>
            )}

            <div className="flex gap-2 flex-wrap justify-center">
              {onNextPrompt && (
                <Button
                  onClick={onNextPrompt}
                  disabled={isLoading}
                  variant="outline"
                  className="gap-2 rounded-lg hover:bg-blue-50 border-2 border-blue-400 text-blue-600 hover:text-blue-700 font-semibold transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('gamePlay.coffeeRoulette.chatting.nextPrompt', {
                    defaultValue: 'Next Prompt',
                  })}
                </Button>
              )}

              {onContinue && (
                <Button
                  onClick={onContinue}
                  disabled={isLoading}
                  className="gap-2 rounded-lg font-semibold transition-all"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('gamePlay.coffeeRoulette.chatting.continue', {
                    defaultValue: 'Continue Chatting',
                  })}
                </Button>
              )}

              {onEnd && (
                <Button
                  onClick={onEnd}
                  disabled={isLoading}
                  variant="destructive"
                  className="gap-2 rounded-lg hover:bg-red-600 font-semibold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  {t('gamePlay.coffeeRoulette.chatting.end', {
                    defaultValue: 'End Session',
                  })}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Window view component with parallax effect
 */
function WindowView({ theme }: { theme: any }) {
  return (
    <motion.div
      className="absolute -inset-8 opacity-40 pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.window} 0%, rgba(255, 255, 255, 0) 100%)`,
        borderRadius: '50% 50% 0 0 / 60% 60% 0 0',
      }}
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
    />
  );
}

/**
 * Prompt display component
 */
function PromptDisplay({ topic }: { topic: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center px-4 py-5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
    >
      <div className="mb-2 flex items-center justify-center gap-2">
        <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
        <p className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--color-text-light)' }}>
          Conversation Starter
        </p>
      </div>

      <motion.p
        key={topic}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-base md:text-lg font-semibold leading-relaxed"
        style={{ color: 'var(--color-primary)' }}
      >
        "{topic}"
      </motion.p>
    </motion.div>
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
