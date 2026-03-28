/**
 * Meeting Room - Participant Avatar display
 */
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import type { MeetingPerson } from './meetingRoom.types';

interface ParticipantAvatarProps {
  person: MeetingPerson;
  isTalking: boolean;
  direction: 'left' | 'right';
}

export function ParticipantAvatar({ person, isTalking, direction }: ParticipantAvatarProps) {
  const { t } = useTranslation();
  const xOffset = direction === 'left' ? -50 : 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: xOffset }}
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
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <Avatar
          className="w-24 h-24 border-4 relative z-10"
          style={{
            borderColor: 'var(--color-primary)',
            boxShadow: '0 12px 32px rgba(108, 92, 231, 0.25)',
          }}
        >
          <AvatarImage src={getSafeImageUrl(person.avatarUrl)} alt={person.name} />
          <AvatarFallback
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontSize: '20px',
              fontWeight: '700',
            }}
          >
            {person.avatar}
          </AvatarFallback>
        </Avatar>
        {isTalking && (
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-success ring-2 ring-white/90 animate-pulse" />
        )}
      </motion.div>
      <div className="text-center">
        <p className="font-bold text-lg" style={{ color: '#111827' }}>
          {person.name}
        </p>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          {t('gamePlay.coffeeRoulette.chatting.participantLabel')}
        </p>
      </div>
    </motion.div>
  );
}
