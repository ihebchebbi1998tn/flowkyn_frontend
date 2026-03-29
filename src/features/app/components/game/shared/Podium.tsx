import { motion } from 'framer-motion';
import { Crown, Zap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AnimatedScore } from './AnimatedScore';
import type { ResultEntry } from './GameResults';

const RANK_CONFIG = {
  1: {
    ring: 'ring-warning/40',
    textColor: 'text-warning',
    iconColor: 'text-warning',
    podiumHeight: 'h-32',
    podiumGradient: 'from-warning/20 to-warning/5',
    scale: 1.05,
  },
  2: {
    ring: 'ring-border',
    textColor: 'text-muted-foreground',
    iconColor: 'text-muted-foreground',
    podiumHeight: 'h-24',
    podiumGradient: 'from-muted/60 to-muted/20',
    scale: 1,
  },
  3: {
    ring: 'ring-warning/20',
    textColor: 'text-warning/70',
    iconColor: 'text-warning/60',
    podiumHeight: 'h-20',
    podiumGradient: 'from-warning/10 to-warning/5',
    scale: 1,
  },
} as const;

interface PodiumProps {
  results: ResultEntry[];
  showScores: boolean;
}

export function Podium({ results, showScores }: PodiumProps) {
  const top3 = results.filter(r => r.rank <= 3).sort((a, b) => a.rank - b.rank);
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : top3;

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5 max-w-lg mx-auto pt-4">
      {podiumOrder.map((entry) => {
        const config = RANK_CONFIG[entry.rank as 1 | 2 | 3] || RANK_CONFIG[3];
        const isFirst = entry.rank === 1;

        return (
          <motion.div
            key={entry.name}
            initial={{ y: 60, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: config.scale }}
            transition={{
              delay: isFirst ? 0.6 : entry.rank === 2 ? 0.2 : 0.4,
              type: 'spring' as const,
              stiffness: 200,
              damping: 15,
            }}
            className="flex flex-col items-center flex-1"
          >
            {isFirst && (
              <motion.div
                initial={{ y: -20, opacity: 0, rotate: -20 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ delay: 1, type: 'spring' as const, stiffness: 300 }}
                className="mb-1"
              >
                <Crown className="h-8 w-8 text-warning drop-shadow-lg" />
              </motion.div>
            )}

            <div className={cn("relative mb-2", isFirst ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-12 w-12 sm:h-14 sm:w-14')}>
              <Avatar className={cn("h-full w-full ring-4", config.ring)}>
                <AvatarFallback className={cn(
                  "font-bold",
                  isFirst ? 'bg-warning/15 text-warning text-lg sm:text-xl' : 'bg-primary/10 text-primary text-sm'
                )}>
                  {entry.avatar}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-[12px] font-black border-2 border-card",
                entry.rank === 1 && 'bg-warning text-warning-foreground',
                entry.rank === 2 && 'bg-muted-foreground/20 text-muted-foreground',
                entry.rank === 3 && 'bg-warning/30 text-warning',
              )}>
                {entry.rank}
              </div>
            </div>

            <p className={cn(
              "font-bold text-foreground truncate max-w-full text-center",
              isFirst ? 'text-[14px] sm:text-[16px]' : 'text-[12px] sm:text-[13px]'
            )}>
              {entry.name}
            </p>

            {showScores && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' as const, stiffness: 400 }}
                className="flex items-center gap-1 mt-1"
              >
                <Zap className={cn("h-3.5 w-3.5", config.iconColor)} />
                <span className={cn("font-black", config.textColor, isFirst ? 'text-[20px] sm:text-[24px]' : 'text-[16px]')}>
                  <AnimatedScore target={entry.score} duration={isFirst ? 1500 : 1000} />
                </span>
              </motion.div>
            )}

            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ delay: isFirst ? 0.8 : 0.4, duration: 0.6, ease: 'easeOut' }}
              className={cn("w-full mt-3 rounded-t-xl bg-gradient-to-b overflow-hidden", config.podiumGradient)}
            >
              <div className={cn("w-full", config.podiumHeight)} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
