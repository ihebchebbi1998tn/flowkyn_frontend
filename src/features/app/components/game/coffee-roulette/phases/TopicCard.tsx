/**
 * Meeting Room - Topic Card (center display)
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface TopicCardProps {
  topic: string;
  decisionRequired: boolean;
}

export function TopicCard({ topic, decisionRequired }: TopicCardProps) {
  const { t } = useTranslation();

  return (
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
          border: '2px solid var(--color-primary)',
          boxShadow: '0 25px 50px rgba(108, 92, 231, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <Lightbulb className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
              {t('gamePlay.coffeeRoulette.chatting.topicCardLabel')}
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
              ✓ {t('gamePlay.coffeeRoulette.chatting.decisionMessage')}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
