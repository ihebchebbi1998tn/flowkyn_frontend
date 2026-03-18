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
        className="w-full py-6 px-8 flex flex-col gap-6"
        style={{
          background: `linear-gradient(to bottom, #f5f3ff 0%, #faf8ff 100%)`,
          minHeight: '460px',
          position: 'relative',
        }}
      >
        {/* Decorative top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(to right, var(--color-primary), #a78bfa, #e879f9)`,
          }}
        />
        {/* Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between px-6 py-3 rounded-xl relative z-10"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: `1px solid #e5e7eb`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Left: Live Badge */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE MEETING
            </div>
          </div>

          {/* Center: Timer */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock
                className="w-4 h-4 font-bold"
                style={{ color: isWarning ? '#ef4444' : '#6b7280' }}
              />
              <motion.span
                className="font-mono font-bold text-sm"
                style={{ color: isWarning ? '#ef4444' : '#111827' }}
                animate={isWarning ? { scale: [1, 1.15, 1] } : {}}
                transition={isWarning ? { duration: 0.8, repeat: Infinity } : {}}
              >
                {displayTime}
              </motion.span>
            </div>
            <div className="h-5 w-px" style={{ backgroundColor: '#e5e7eb' }} />
            <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
              Topic {promptsUsed}/{maxPrompts}
            </span>
          </div>

          {/* Right: Empty space */}
          <div className="w-20" />
        </motion.div>

        {/* Main Content - Professional Meeting Layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex gap-8 items-center justify-center relative z-10 px-6"
        >
          {/* Left Participant */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{
                  backgroundColor: 'var(--color-primary)',
                }}
              />
              <Avatar 
                className="w-28 h-28 border-4 relative z-10"
                style={{ 
                  borderColor: 'var(--color-primary)',
                  boxShadow: '0 12px 32px rgba(108, 92, 231, 0.25)',
                }}
              >
                <AvatarImage src={getSafeImageUrl(person1.avatarUrl)} alt={person1.name} />
                <AvatarFallback
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}
                >
                  {person1.avatar}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: '#111827' }}>
                {person1.name}
              </p>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Participant
              </p>
            </div>
          </motion.div>

          {/* Center: Topic Card - Main Professional Focus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative flex-shrink-0"
          >
            <div
              className="rounded-2xl p-10 flex flex-col justify-between w-96 min-h-56"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.99)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(250, 248, 255, 0.8) 100%)',
                border: `2px solid var(--color-primary)`,
                boxShadow: '0 25px 50px rgba(108, 92, 231, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <Lightbulb className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                    Today's Topic
                  </p>
                </div>
                <motion.p
                  key={topic}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold leading-relaxed"
                  style={{ color: '#111827', wordBreak: 'break-word' }}
                >
                  {topic}
                </motion.p>
              </div>

              {/* Decision Message */}
              {decisionRequired && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 pt-6 border-t-2"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <p className="text-sm font-bold text-center" style={{ color: 'var(--color-primary)' }}>
                    ✓ Time to decide together!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Participant */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{
                  backgroundColor: 'var(--color-primary)',
                }}
              />
              <Avatar 
                className="w-28 h-28 border-4 relative z-10"
                style={{ 
                  borderColor: 'var(--color-primary)',
                  boxShadow: '0 12px 32px rgba(108, 92, 231, 0.25)',
                }}
              >
                <AvatarImage src={getSafeImageUrl(person2.avatarUrl)} alt={person2.name} />
                <AvatarFallback
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}
                >
                  {person2.avatar}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: '#111827' }}>
                {person2.name}
              </p>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Participant
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Professional Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-3 justify-center relative z-10"
        >
          {onNextPrompt && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onNextPrompt}
                disabled={isLoading}
                className="gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all text-white"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  border: 'none',
                  boxShadow: '0 8px 16px rgba(108, 92, 231, 0.25)',
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Next Topic
              </Button>
            </motion.div>
          )}

          {onContinue && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onContinue}
                disabled={isLoading}
                className="gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
                variant="outline"
                style={{
                  borderColor: '#e5e7eb',
                  color: '#111827',
                  borderWidth: '2px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Keep Talking
              </Button>
            </motion.div>
          )}

          {onEnd && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onEnd}
                disabled={isLoading}
                className="gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all text-white"
                style={{
                  backgroundColor: '#dc2626',
                  border: 'none',
                  boxShadow: '0 8px 16px rgba(220, 38, 38, 0.25)',
                }}
              >
                <LogOut className="w-4 h-4" />
                End Meeting
              </Button>
            </motion.div>
          )}
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
