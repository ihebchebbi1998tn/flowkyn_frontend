/**
 * Coffee Roulette - Meeting Room (Redesigned)
 * Compact, beautiful meeting interface
 * Takes minimal height, only what's needed
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
        className="w-full py-8 px-6 flex flex-col gap-4"
        style={{
          background: `linear-gradient(135deg, #f8f9ff 0%, #f5f0ff 50%, #fff5f9 100%)`,
          minHeight: '380px',
          position: 'relative',
        }}
      >
        {/* Background Room Effect */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden opacity-5 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, rgba(200, 180, 220, 0.3), rgba(255, 200, 220, 0.2))`,
            border: '2px solid rgba(108, 92, 231, 0.1)',
          }}
        />
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 border rounded-xl backdrop-blur-md relative z-10"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'hsl(270 100% 88%)',
            boxShadow: '0 4px 12px rgba(108, 92, 231, 0.08)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Status */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px]"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(108, 92, 231, 0.3)',
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-bold">LIVE MEETING</span>
              </div>
            </div>

            {/* Center: Timer & Counter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock
                  className="w-4 h-4"
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
              <div className="h-5 w-px" style={{ backgroundColor: 'hsl(270 100% 88%)' }} />
              <span className="text-[11px]" style={{ color: 'var(--color-text-light)' }}>
                Topic {promptsUsed}/{maxPrompts}
              </span>
            </div>

            {/* Right: Empty for balance */}
            <div className="w-16" />
          </div>
        </motion.div>

        {/* Main Content - Real Meeting Room Scene */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex gap-6 items-center justify-center relative z-10"
        >
          {/* Left Participant - Larger */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Avatar 
                className="w-24 h-24"
                style={{ 
                  outlineWidth: '4px',
                  outlineColor: 'var(--color-primary)',
                  outlineOffset: '4px',
                  boxShadow: '0 8px 24px rgba(108, 92, 231, 0.25)',
                }}
              >
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
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                {person1.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                Participant
              </p>
            </div>
          </motion.div>

          {/* Center: Topic Card - Main Focus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div
              className="rounded-2xl p-8 flex flex-col justify-between w-80 min-h-48"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.99)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(245, 240, 255, 0.7) 100%)',
                border: `3px solid var(--color-primary)`,
                boxShadow: '0 20px 40px rgba(108, 92, 231, 0.2)',
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                    Conversation Topic
                  </p>
                </div>
                <motion.p
                  key={topic}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-2xl font-bold leading-relaxed"
                  style={{ color: 'var(--color-text)', wordBreak: 'break-word' }}
                >
                  "{topic}"
                </motion.p>
              </div>

              {/* Decision Message */}
              {decisionRequired && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 pt-4 border-t-2"
                  style={{ borderColor: 'hsl(270 100% 90%)' }}
                >
                  <p className="text-sm font-bold text-center" style={{ color: 'var(--color-primary)' }}>
                    ✓ Time to make a decision!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Participant - Larger */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Avatar 
                className="w-24 h-24"
                style={{ 
                  outlineWidth: '4px',
                  outlineColor: 'var(--color-primary)',
                  outlineOffset: '4px',
                  boxShadow: '0 8px 24px rgba(108, 92, 231, 0.25)',
                }}
              >
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
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                {person2.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
                Participant
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Compact Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="px-4 py-2.5 border rounded-xl backdrop-blur-md relative z-10"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'hsl(270 100% 88%)',
            boxShadow: '0 4px 12px rgba(108, 92, 231, 0.08)',
          }}
        >
          <div className="flex gap-2 flex-wrap justify-center">
            {onNextPrompt && (
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <Button
                  onClick={onNextPrompt}
                  disabled={isLoading}
                  className="gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all text-white"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Next Topic
                </Button>
              </motion.div>
            )}

            {onContinue && (
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
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
                  Keep Talking
                </Button>
              </motion.div>
            )}

            {onEnd && (
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <Button
                  onClick={onEnd}
                  disabled={isLoading}
                  className="gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all text-white"
                  style={{
                    backgroundColor: '#ef4444',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  End Meeting
                </Button>
              </motion.div>
            )}
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
