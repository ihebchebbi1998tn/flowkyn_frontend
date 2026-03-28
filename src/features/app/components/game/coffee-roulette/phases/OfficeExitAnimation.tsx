/**
 * Coffee Roulette - Office Exit Animation
 * Phase 4: Complete Phase
 * Celebration confetti, connection summary, and next action options
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle, Repeat2, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useRoomTheme, useThemeVariables } from '../theme/RoomThemeContext';

interface Person {
  participantId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
}

interface OfficeExitAnimationProps {
  person1: Person;
  person2: Person;
  topic: string;
  duration: number; // In seconds
  promptsUsed: number;
  onReset?: () => void;
  onExit?: () => void;
  isLoading?: boolean;
}

/**
 * Confetti particle component
 */
function Confetti() {
  return (
    <>
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none"
          initial={{
            x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
            y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
            opacity: 1,
          }}
          animate={{
            x:
              (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerWidth : 0),
            y:
              (Math.random() + 0.5) *
              (typeof window !== 'undefined' ? window.innerHeight : 0),
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2.5 + Math.random(),
            ease: 'easeOut',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98'][
                i % 4
              ],
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

export function OfficeExitAnimation({
  person1,
  person2,
  topic,
  duration,
  promptsUsed,
  onReset,
  onExit,
  isLoading = false,
}: OfficeExitAnimationProps) {
  const { t } = useTranslation();
  const { theme } = useRoomTheme();
  const themeVars = useThemeVariables();
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti on mount
  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div style={themeVars as React.CSSProperties}>
      <div
        className="h-full min-h-0 relative overflow-hidden flex items-center justify-center py-10 md:py-16"
        style={{
          background: `var(--gradient-room)`,
        }}
      >
        {/* Confetti animation */}
        {showConfetti && <Confetti />}

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--color-primary) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 max-w-xl mx-auto px-4"
        >
          {/* Success checkmark */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.4,
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent)',
                boxShadow: '0 0 30px var(--color-accent)',
              }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-center mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            {t('gamePlay.coffeeRoulette.complete.title', {
              defaultValue: 'Great Connection!',
            })}
          </motion.h1>

          {/* Connection summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-6 text-center"
          >
            <p className="text-base md:text-lg mb-4" style={{ color: 'var(--color-text-light)' }}>
              {t('gamePlay.coffeeRoulette.complete.subtitle', {
                defaultValue: 'You had an amazing conversation!',
              })}
            </p>

            {/* Participants */}
            <div className="flex items-center justify-center gap-4 md:gap-6 mb-6">
              {/* Person 1 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="flex flex-col items-center gap-1.5"
              >
                <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-2" style={{ '--tw-ring-color': 'var(--color-primary)' } as any}>
                  <AvatarImage
                    src={getSafeImageUrl(person1.avatarUrl)}
                    alt={person1.name}
                  />
                  <AvatarFallback
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                    }}
                  >
                    {person1.avatar}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs md:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {person1.name}
                </p>
              </motion.div>

              {/* Connection indicator */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              </motion.div>

              {/* Person 2 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="flex flex-col items-center gap-1.5"
              >
                <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-2" style={{ '--tw-ring-color': 'var(--color-primary)' } as any}>
                  <AvatarImage
                    src={getSafeImageUrl(person2.avatarUrl)}
                    alt={person2.name}
                  />
                  <AvatarFallback
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                    }}
                  >
                    {person2.avatar}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs md:text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {person2.name}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6"
          >
            {/* Duration card */}
            <StatCard
              icon="⏱️"
              label={t('gamePlay.coffeeRoulette.complete.duration', {
                defaultValue: 'Duration',
              })}
              value={`${minutes}m ${seconds}s`}
            />

            {/* Prompts card */}
            <StatCard
              icon="💡"
              label={t('gamePlay.coffeeRoulette.complete.prompts', {
                defaultValue: 'Prompts',
              })}
              value={`${promptsUsed} used`}
            />

            {/* Topic card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              className="col-span-2 px-4 py-4 rounded-lg"
              style={{
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-light)' }}>
                {t('gamePlay.coffeeRoulette.complete.topicDiscussed', {
                  defaultValue: 'TOPIC DISCUSSED',
                })}
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                "{topic}"
              </p>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            {onReset && (
              <Button
                onClick={onReset}
                disabled={isLoading}
                size="lg"
                className="gap-2"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Repeat2 className="w-5 h-5" />
                {t('gamePlay.coffeeRoulette.complete.matchAgain', {
                  defaultValue: 'Match Again',
                })}
              </Button>
            )}

            {onExit && (
              <Button
                onClick={onExit}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                {t('gamePlay.coffeeRoulette.complete.exit', {
                  defaultValue: 'Exit',
                })}
              </Button>
            )}
          </motion.div>

          {/* Motivational message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="text-center mt-8 text-sm"
            style={{ color: 'var(--color-text-light)' }}
          >
            {t('gamePlay.coffeeRoulette.complete.message', {
              defaultValue: '✨ Every conversation is a chance to connect and grow ✨',
            })}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4 py-3 rounded-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-light)' }}>
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
        {value}
      </p>
    </motion.div>
  );
}
