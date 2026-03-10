import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playCountBeep, playGoBeep } from './audio';

interface CountdownOverlayProps {
  active: boolean;
  onComplete: () => void;
  from?: number;
  finalText?: string;
  accentColor?: string;
}

const numberVariants = {
  enter: { scale: 0.3, opacity: 0, rotateX: -45 },
  center: {
    scale: 1, opacity: 1, rotateX: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20, duration: 0.5 },
  },
  exit: {
    scale: 2.5, opacity: 0,
    transition: { duration: 0.4, ease: 'easeIn' as const },
  },
};

const ringVariants = {
  initial: { scale: 0.8, opacity: 0.6 },
  animate: {
    scale: [0.8, 1.2, 0.8],
    opacity: [0.6, 0.2, 0.6],
    transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

const particleCount = 12;

export function CountdownOverlay({
  active, onComplete, from = 3, finalText = 'GO!', accentColor = 'primary',
}: CountdownOverlayProps) {
  const [count, setCount] = useState<number | null>(null);
  const [showFinal, setShowFinal] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const reset = useCallback(() => {
    setCount(null);
    setShowFinal(false);
    setShowParticles(false);
  }, []);

  useEffect(() => {
    if (!active) { reset(); return; }

    setCount(from);
    playCountBeep();

    const intervals: NodeJS.Timeout[] = [];
    for (let i = 1; i <= from; i++) {
      intervals.push(
        setTimeout(() => {
          if (i < from) {
            setCount(from - i);
            playCountBeep();
          } else {
            setCount(null);
            setShowFinal(true);
            setShowParticles(true);
            playGoBeep();
            setTimeout(() => { setShowFinal(false); setShowParticles(false); onComplete(); }, 1000);
          }
        }, i * 900)
      );
    }
    return () => intervals.forEach(clearTimeout);
  }, [active, from, onComplete, reset]);

  if (!active && !count && !showFinal) return null;

  return (
    <AnimatePresence>
      {(active || showFinal) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" />

          <motion.div variants={ringVariants} initial="initial" animate="animate"
            className="absolute h-[280px] w-[280px] rounded-full border-2"
            style={{ borderColor: `hsl(var(--${accentColor}) / 0.2)` }} />
          <motion.div variants={ringVariants} initial="initial" animate="animate"
            className="absolute h-[360px] w-[360px] rounded-full border"
            style={{ borderColor: `hsl(var(--${accentColor}) / 0.1)`, animationDelay: '0.3s' }} />

          {showParticles && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: particleCount }).map((_, i) => {
                const angle = (360 / particleCount) * i;
                return (
                  <motion.div key={i}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: Math.cos((angle * Math.PI) / 180) * 200, y: Math.sin((angle * Math.PI) / 180) * 200, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.8, delay: Math.random() * 0.2, ease: 'easeOut' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(var(--${accentColor}) / ${0.5 + Math.random() * 0.5})` }} />
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="relative">
            <AnimatePresence mode="wait">
              {count !== null && (
                <motion.div key={count} variants={numberVariants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center">
                  <span className="text-[120px] sm:text-[160px] font-black leading-none tabular-nums" style={{ color: `hsl(var(--${accentColor}))` }}>{count}</span>
                  <motion.div initial={{ width: 0 }} animate={{ width: 80 }} transition={{ duration: 0.3, delay: 0.1 }}
                    className="h-1 rounded-full mt-2" style={{ backgroundColor: `hsl(var(--${accentColor}) / 0.4)` }} />
                </motion.div>
              )}
              {showFinal && (
                <motion.div key="go"
                  initial={{ scale: 0.2, opacity: 0, rotateZ: -10 }}
                  animate={{ scale: 1, opacity: 1, rotateZ: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 15 } }}
                  exit={{ scale: 3, opacity: 0, transition: { duration: 0.5 } }}
                  className="flex flex-col items-center">
                  <span className="text-[80px] sm:text-[120px] font-black leading-none tracking-tight"
                    style={{ color: `hsl(var(--${accentColor}))`, textShadow: `0 0 60px hsl(var(--${accentColor}) / 0.4)` }}>
                    {finalText}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
