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
          {/* Professional gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${theme.colors.background}, ${theme.colors.surface})`,
              opacity: 0.4,
            }}
          />

          {/* Floor perspective */}
          <div
            className="absolute bottom-0 inset-x-0 h-1/4"
            style={{
              background: `linear-gradient(to bottom, transparent, ${theme.colors.floor})`,
              opacity: 0.25,
            }}
          />
        </div>

        {/* Top bar with professional styling */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-20 px-4 py-3 border-b backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderColor: 'var(--color-primary-light)',
          }}
        >
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex gap-4">
              <div
                className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                }}
              >
                {t('gamePlay.coffeeRoulette.chatting.meeting', {
                  defaultValue: 'Meeting',
                })}
              </div>
              <motion.div
                className="px-3 py-1.5 rounded-md text-xs font-mono font-bold"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-primary)',
                }}
                animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
                transition={isWarning ? { duration: 1, repeat: Infinity } : {}}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                {displayTime}
              </motion.div>
            </div>
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--color-text-light)' }}
            >
              {t('gamePlay.coffeeRoulette.chatting.prompts', {
                defaultValue: `Prompts: ${promptsUsed}/${maxPrompts}`,
              })}
            </p>
          </div>
        </motion.div>

        {/* Main chat area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6">
          {/* Meeting room container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl relative"
          >
            {/* Room content - Professional card style */}
            <div className="relative z-10 px-8 py-10 rounded-2xl backdrop-blur-md" style={{
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              border: `2px solid var(--color-primary-light)`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            }}>
              {/* Participants section */}
              <div className="flex items-end justify-between mb-10 pb-6 border-b border-gray-200">
                {/* Person 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Avatar className="w-24 h-24 ring-4 ring-offset-2" style={{ borderColor: 'var(--color-primary)' }}>
                    <AvatarImage
                      src={getSafeImageUrl(person1.avatarUrl)}
                      alt={person1.name}
                    />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: '600',
                      }}
                    >
                      {person1.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                      {person1.name}
                    </p>
                  </div>
                </motion.div>

                {/* Visual separator */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl opacity-60"
                >
                  ·
                </motion.div>

                {/* Person 2 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Avatar className="w-24 h-24 ring-4 ring-offset-2" style={{ borderColor: 'var(--color-primary)' }}>
                    <AvatarImage
                      src={getSafeImageUrl(person2.avatarUrl)}
                      alt={person2.name}
                    />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: '600',
                      }}
                    >
                      {person2.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                      {person2.name}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Divider */}
              <div
                className="h-0.5 my-8 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, var(--color-primary-light), transparent)`,
                }}
              />

              {/* Prompt Display - Professional style */}
              <PromptDisplay topic={topic} />
            </div>
          </motion.div>
        </div>

        {/* Action buttons - Fixed layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-20 px-4 py-6 border-t backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'var(--color-primary-light)',
          }}
        >
          <div className="max-w-3xl mx-auto">
            {decisionRequired && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-3 rounded-lg border-l-4 mb-4"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-text)',
                }}
              >
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  {t('gamePlay.coffeeRoulette.chatting.keepTalking', {
                    defaultValue: 'What would you like to do?',
                  })}
                </p>
              </motion.div>
            )}

            <div className="flex gap-3 flex-wrap justify-center">
              {onNextPrompt && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={onNextPrompt}
                    disabled={isLoading}
                    className="gap-2 rounded-lg font-semibold transition-all px-6 py-2.5 text-white"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      border: 'none',
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t('gamePlay.coffeeRoulette.chatting.nextPrompt', {
                      defaultValue: 'New Prompt',
                    })}
                  </Button>
                </motion.div>
              )}

              {onContinue && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={onContinue}
                    disabled={isLoading}
                    className="gap-2 rounded-lg font-semibold transition-all px-6 py-2.5"
                    variant="outline"
                    style={{
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)',
                      backgroundColor: 'transparent',
                      borderWidth: '2px',
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('gamePlay.coffeeRoulette.chatting.continue', {
                      defaultValue: 'Keep Chatting',
                    })}
                  </Button>
                </motion.div>
              )}

              {onEnd && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={onEnd}
                    disabled={isLoading}
                    variant="destructive"
                    className="gap-2 rounded-lg font-semibold transition-all px-6 py-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('gamePlay.coffeeRoulette.chatting.end', {
                      defaultValue: 'End Session',
                    })}
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
      className="text-center px-6 py-6 rounded-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid var(--color-primary-light)`,
      }}
    >
      <div className="mb-3 flex items-center justify-center gap-2">
        <Lightbulb className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-light)' }}>
          Today's Topic
        </p>
      </div>

      <motion.p
        key={topic}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-lg font-semibold leading-relaxed"
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
