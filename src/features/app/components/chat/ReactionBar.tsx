import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface ReactionBarProps {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
  isOwn: boolean;
}

export function ReactionBar({ reactions, onToggle, isOwn }: ReactionBarProps) {
  if (reactions.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap px-1 mt-0.5", isOwn && "justify-end")}>
      {reactions.map((r) => (
        <motion.button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium",
            "border transition-all duration-150",
            r.reacted
              ? "bg-primary/12 text-primary border-primary/25 shadow-sm shadow-primary/10"
              : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/60"
          )}
        >
          <span className="text-[12px] leading-none">{r.emoji}</span>
          <span className="tabular-nums min-w-[0.75rem] text-center">{r.count}</span>
        </motion.button>
      ))}
    </div>
  );
}
