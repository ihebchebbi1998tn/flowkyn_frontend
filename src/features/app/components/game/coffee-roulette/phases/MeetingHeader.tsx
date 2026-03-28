/**
 * Meeting Room - Header bar with timer and topic counter
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { formatMeetingTime } from './meetingRoom.types';

interface MeetingHeaderProps {
  timeRemaining: number;
  isWarning: boolean;
  promptsUsed: number;
  maxPrompts: number;
}

export function MeetingHeader({ timeRemaining, isWarning, promptsUsed, maxPrompts }: MeetingHeaderProps) {
  const { t } = useTranslation();
  const displayTime = formatMeetingTime(timeRemaining);

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between px-5 py-2 rounded-xl relative z-10"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Left: Live Badge */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {t('gamePlay.coffeeRoulette.chatting.liveBadge')}
        </div>
      </div>

      {/* Center: Timer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 font-bold" style={{ color: isWarning ? '#ef4444' : '#6b7280' }} />
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
          {t('gamePlay.coffeeRoulette.chatting.topicCounter', { current: promptsUsed, max: maxPrompts })}
        </span>
      </div>

      {/* Right: Spacer */}
      <div className="w-20" />
    </motion.div>
  );
}
