/**
 * Coffee Roulette - Elevator Sequence
 * Phase 2: Matching Phase (3.5 seconds animation)
 * 6-stage animation sequence showing elevator rising and doors opening
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRoomTheme, useThemeVariables } from '../theme/RoomThemeContext';
import {
  useCompleteElevatorSequence,
  ANIMATION_CONFIG,
  TOTAL_ANIMATION_DURATION,
} from '../animations/useAnimations';

interface ElevatorSequenceProps {
  pairNumber: number;
  totalPairs: number;
  onSequenceComplete: () => void;
}

/**
 * Main elevator shaft component showing the animation
 */
export function ElevatorSequence({ pairNumber, totalPairs, onSequenceComplete }: ElevatorSequenceProps) {
  const { theme } = useRoomTheme();
  const themeVars = useThemeVariables();
  const { t } = useTranslation();
  const { stage, startAnimation, isComplete } = useCompleteElevatorSequence();
  const [currentFloor, setCurrentFloor] = useState(1);

  // Auto-start animation when component mounts
  useEffect(() => {
    const timer = setTimeout(() => startAnimation(), 100);
    return () => clearTimeout(timer);
  }, [startAnimation]);

  // Update floor counter during rise
  useEffect(() => {
    if (stage !== 'animating') return;

    let floor = 1;
    const floorUpdateInterval = ANIMATION_CONFIG.elevatorRise.duration * 100;
    const interval = setInterval(() => {
      floor += 1;
      setCurrentFloor(floor);
    }, floorUpdateInterval);

    return () => clearInterval(interval);
  }, [stage]);

  // Trigger callback when animation completes
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onSequenceComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onSequenceComplete]);

  return (
    <div style={themeVars as React.CSSProperties}>
      <div
        className="h-full min-h-0 flex items-center justify-center relative overflow-hidden"
        style={{
          background: `var(--gradient-room)`,
        }}
      >
        {/* Building structure background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="grid grid-cols-6 h-full">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="border-r"
                style={{ borderColor: 'var(--color-wall)' }}
              />
            ))}
          </div>
        </div>

        {/* Elevator Shaft Container */}
        <div className="relative w-full max-w-md">
          {/* Floor Counter Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-20 left-0 right-0 text-center z-20"
          >
            <motion.p
              key={currentFloor}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="text-3xl font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('gamePlay.coffeeRoulette.matching.floorCounter', { floor: currentFloor })}
            </motion.p>
          </motion.div>

          {/* Elevator Car - STAGE 1 & 2: Door Close + Rise */}
          <motion.div
            initial={{ y: 0 }}
            animate={stage === 'animating' ? { y: -400 } : { y: 0 }}
            transition={{
              duration: ANIMATION_CONFIG.doorClose.duration + ANIMATION_CONFIG.elevatorRise.duration,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative"
          >
            {/* Elevator exterior */}
            <div
              className="w-full aspect-square rounded-lg shadow-2xl overflow-hidden"
              style={{
                background: `var(--gradient-elevator)`,
                border: `3px solid var(--color-primary-dark)`,
              }}
            >
              {/* Elevator interior */}
              <div className="w-full h-full relative flex flex-col items-center justify-center p-6">
                {/* Ceiling */}
                <div
                  className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, var(--color-primary-light), var(--color-primary))`,
                  }}
                />

                {/* Loading indicator during rise */}
                <motion.div
                  className="relative"
                  animate={stage === 'animating' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{
                    duration: 0.8,
                    repeat: stage === 'animating' ? Infinity : 0,
                  }}
                >
                  <div className="w-16 h-16 rounded-full border-4 border-white border-t-transparent" />
                  <p className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
                    {pairNumber}
                  </p>
                </motion.div>

                {/* Floor number inside elevator */}
                <motion.p
                  className="absolute bottom-8 text-white font-semibold text-sm opacity-75"
                  animate={stage === 'animating' ? { y: -10 } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {t('gamePlay.coffeeRoulette.matching.floorCounter', { floor: currentFloor })}
                </motion.p>
              </div>

              {/* Left Door - STAGE 1: Close / STAGE 5: Open */}
              <motion.div
                initial={{ x: 0 }}
                animate={(stage === 'animating' ? [{ x: 0 }, { x: -50 }, { x: 50 }] : { x: 0 }) as any}
                transition={{
                  times: [0, 0.1, 0.9],
                  duration: TOTAL_ANIMATION_DURATION,
                  ease: 'linear',
                }}
                className="absolute inset-0 w-1/2 left-0 origin-right"
                style={{
                  background: `linear-gradient(90deg, var(--color-door) 0%, var(--color-primary) 100%)`,
                  boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2)',
                }}
              >
                {/* Door handle */}
                <div
                  className="absolute top-1/2 right-4 w-2 h-8 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-door-handle)',
                    transform: 'translateY(-50%)',
                  }}
                />
              </motion.div>

              {/* Right Door - STAGE 1: Close / STAGE 5: Open */}
              <motion.div
                initial={{ x: 0 }}
                animate={(stage === 'animating' ? [{ x: 0 }, { x: 50 }, { x: -50 }] : { x: 0 }) as any}
                transition={{
                  times: [0, 0.1, 0.9],
                  duration: TOTAL_ANIMATION_DURATION,
                  ease: 'linear',
                }}
                className="absolute inset-0 w-1/2 right-0 origin-left"
                style={{
                  background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-door) 100%)`,
                  boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.2)',
                }}
              >
                {/* Door handle */}
                <div
                  className="absolute top-1/2 left-4 w-2 h-8 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-door-handle)',
                    transform: 'translateY(-50%)',
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Floor Indicator Lights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === 'animating' ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -right-16 top-1/2 transform -translate-y-1/2 space-y-2"
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    i < currentFloor ? 'var(--color-accent)' : 'var(--color-surface)',
                  boxShadow:
                    i < currentFloor
                      ? '0 0 8px var(--color-accent)'
                      : 'none',
                }}
                animate={i < currentFloor ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            ))}
          </motion.div>

          {/* Pair Counter Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute -bottom-24 left-0 right-0 text-center"
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {t('gamePlay.coffeeRoulette.matching.pairProgress', { current: pairNumber, total: totalPairs })}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
              {isComplete
                ? t('gamePlay.coffeeRoulette.matching.doorsOpening')
                : t('gamePlay.coffeeRoulette.matching.matching')}
            </p>
          </motion.div>
        </div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-64 h-1 rounded-full" style={{ backgroundColor: 'var(--color-surface)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
              initial={{ width: '0%' }}
              animate={{ width: stage === 'animating' ? '100%' : '0%' }}
              transition={{ duration: TOTAL_ANIMATION_DURATION }}
            />
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-light)' }}>
            {Math.round((currentFloor / 10) * 100)}%
          </p>
        </motion.div>
      </div>
    </div>
  );
}
