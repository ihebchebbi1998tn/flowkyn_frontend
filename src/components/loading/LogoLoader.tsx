import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/flowkyn-logo-full.png';

interface LogoLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable loading screen element featuring the Flowkyn logo + animated dots.
 * Sized appropriately depending on context (page-level vs section-level).
 */
export function LogoLoader({ className, size = 'lg' }: LogoLoaderProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24 sm:w-32 sm:h-32',
    lg: 'w-32 h-32 sm:w-40 sm:h-40',
  };

  const dotClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <AnimatePresence>
      <motion.div
        key="logo-loader"
        className={cn('flex flex-col items-center justify-center p-8', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Logo */}
        <motion.img
          src={logoImg}
          alt="Loading Flowkyn..."
          className={cn('object-contain', sizeClasses[size])}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Loading dots */}
        <div className="mt-4 sm:mt-8 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn('rounded-full', dotClasses[size])}
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
