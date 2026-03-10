import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import logoImg from '@/assets/flowkyn-logo.png';

/**
 * Simple loading screen: Flowkyn logo + animated loading dots.
 */
export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 2200);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Logo */}
        <motion.img
          src={logoImg}
          alt="Flowkyn"
          className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Loading dots */}
        <div className="mt-8 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background:
                  i === 0
                    ? '#d946a8'
                    : i === 1
                      ? '#a855f7'
                      : '#f97316',
              }}
              initial={{ opacity: 0.3, scale: 0.6 }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.6, 1.2, 0.6],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
