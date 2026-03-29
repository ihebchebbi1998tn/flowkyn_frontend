import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CONFETTI_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--info))',
  'hsl(248 76% 75%)',
  'hsl(38 92% 65%)',
];

export function ConfettiParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 3;
        const size = 4 + Math.random() * 8;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const rotation = Math.random() * 360;
        const shape = i % 3 === 0 ? 'rounded-full' : i % 3 === 1 ? 'rounded-sm' : '';

        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: '100vh',
              x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60],
              opacity: [1, 1, 0],
              rotate: rotation + 720,
            }}
            transition={{
              duration,
              delay,
              ease: 'easeIn',
              repeat: Infinity,
              repeatDelay: Math.random() * 2,
            }}
            className={cn("absolute", shape)}
            style={{
              left: `${left}%`,
              width: size,
              height: size * (i % 3 === 1 ? 0.6 : 1),
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}
