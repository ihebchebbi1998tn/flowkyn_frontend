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
        className="flex flex-col h-screen"
        style={{
          background: `linear-gradient(135deg, #f8f9ff 0%, #f5f0ff 50%, #fff5f9 100%)`,
        }}
      >
        {/* Ultra-compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 border-b flex-shrink-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            borderColor: 'hsl(270 100% 90%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* Left: Status */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="font-bold">
                  {t('gamePlay.coffeeRoulette.chatting.meeting', { defaultValue: 'LIVE' })}
                </span>
              </div>
            </div>

            {/* Center: Timer & Counter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock
                  className="w-3.5 h-3.5"
                  style={{ color: isWarning ? '#ef4444' : 'var(--color-primary)' }}
                />
                <motion.span
                  className="font-mono font-bold text-xs"
                  style={{ color: isWarning ? '#ef4444' : 'var(--color-primary)' }}
                  animate={isWarning ? { scale: [1, 1.1, 1] } : {}}
                  transition={isWarning ? { duration: 1, repeat: Infinity } : {}}
                >
                  {displayTime}
                </motion.span>
              </div>
              <div className="h-4 w-px" style={{ backgroundColor: 'hsl(270 100% 90%)' }} />
              <span className="text-[11px]" style={{ color: 'var(--color-text-light)' }}>
                Prompt {promptsUsed}/{maxPrompts}
              </span>
            </div>

            {/* Right: Empty for balance */}
            <div className="w-12" />
          </div>
        </motion.div>

        {/* Main Content - Highly Compact */}
        <div className="flex-1 flex items-center justify-center px-3 py-2 overflow-y-auto min-h-0">
          <div className="w-full max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-2 h-full"
            >
              {/* Left: Participants - Compact Stack */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {/* Person 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-lg p-2 flex items-center gap-2 flex-shrink-0"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: `1.5px solid hsl(270 100% 92%)`,
                    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.06)',
                  }}
                >
                  <Avatar className="w-12 h-12 flex-shrink-0" style={{ outlineWidth: '2px', outlineColor: 'var(--color-primary)', outlineOffset: '2px' }}>
                    <AvatarImage src={getSafeImageUrl(person1.avatarUrl)} alt={person1.name} />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {person1.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-[12px] truncate" style={{ color: 'var(--color-text)' }}>
                      {person1.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>
                      Guest
                    </p>
                  </div>
                </motion.div>

                {/* Person 2 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="rounded-lg p-2 flex items-center gap-2 flex-shrink-0"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: `1.5px solid hsl(270 100% 92%)`,
                    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.06)',
                  }}
                >
                  <Avatar className="w-12 h-12 flex-shrink-0" style={{ outlineWidth: '2px', outlineColor: 'var(--color-primary)', outlineOffset: '2px' }}>
                    <AvatarImage src={getSafeImageUrl(person2.avatarUrl)} alt={person2.name} />
                    <AvatarFallback
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '700',
                      }}
                    >
                      {person2.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-[12px] truncate" style={{ color: 'var(--color-text)' }}>
                      {person2.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>
                      Guest
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right: Topic Card - Prominent */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 rounded-xl p-3 flex flex-col justify-between min-h-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.99)',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(245, 240, 255, 0.5) 100%)',
                  border: `2px solid var(--color-primary)`,
                  boxShadow: '0 8px 24px rgba(108, 92, 231, 0.12)',
                }}
              >
                <div className="min-h-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                      Today's Topic
                    </p>
                  </div>
                  <motion.p
                    key={topic}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-semibold leading-snug"
                    style={{ color: 'var(--color-text)', wordBreak: 'break-word' }}
                  >
                    "{topic}"
                  </motion.p>
                </div>

                {/* Decision Message */}
                {decisionRequired && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 pt-2 border-t"
                    style={{ borderColor: 'hsl(270 100% 90%)' }}
                  >
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                      ✓ Time to decide!
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Ultra-Compact Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="px-4 py-1.5 border-t flex-shrink-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            borderColor: 'hsl(270 100% 90%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-1 flex-wrap justify-center">
              {onNextPrompt && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onNextPrompt}
                    disabled={isLoading}
                    className="gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all text-white"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      border: 'none',
                    }}
                  >
                    <MessageCircle className="w-3 h-3" />
                    Next Prompt
                  </Button>
                </motion.div>
              )}

              {onContinue && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onContinue}
                    disabled={isLoading}
                    className="gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all"
                    variant="outline"
                    style={{
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)',
                      borderWidth: '1px',
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Continue Chat
                  </Button>
                </motion.div>
              )}

              {onEnd && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onEnd}
                    disabled={isLoading}
                    className="gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all text-white"
                    style={{
                      backgroundColor: '#ef4444',
                    }}
                  >
                    <LogOut className="w-3 h-3" />
                    End
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
