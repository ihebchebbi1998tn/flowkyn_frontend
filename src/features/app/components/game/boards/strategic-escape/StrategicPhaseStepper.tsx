import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Settings2, Users, MessageSquare, Flag, Check } from 'lucide-react';
import type { StrategicPhase } from '../strategicEscape.types';

const PHASES: { key: StrategicPhase; icon: typeof Settings2; labelKey: string }[] = [
  { key: 'setup', icon: Settings2, labelKey: 'Setup' },
  { key: 'roles_assignment', icon: Users, labelKey: 'Roles' },
  { key: 'discussion', icon: MessageSquare, labelKey: 'Discussion' },
  { key: 'debrief', icon: Flag, labelKey: 'Debrief' },
];

const PHASE_INDEX: Record<StrategicPhase, number> = {
  setup: 0,
  roles_assignment: 1,
  discussion: 2,
  debrief: 3,
};

interface Props {
  currentPhase: StrategicPhase;
  t: (key: string, opts?: any) => string;
}

export function StrategicPhaseStepper({ currentPhase, t }: Props) {
  const currentIdx = PHASE_INDEX[currentPhase] ?? 0;

  return (
    <div className="flex items-center gap-1 w-full">
      {PHASES.map((phase, idx) => {
        const Icon = phase.icon;
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={phase.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1 relative">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1 : 0.85,
                  opacity: isFuture ? 0.4 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={cn(
                  'relative flex items-center justify-center h-9 w-9 rounded-xl border-2 transition-colors',
                  isActive && 'border-primary bg-primary/10 shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]',
                  isDone && 'border-success bg-success/10',
                  isFuture && 'border-border bg-muted/30',
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                )}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-primary"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  'text-[10px] font-medium whitespace-nowrap',
                  isActive && 'text-primary',
                  isDone && 'text-success',
                  isFuture && 'text-muted-foreground/50',
                )}
              >
                {t(`strategic.phases.${phase.key === 'roles_assignment' ? 'rolesAssignment' : phase.key}`, { defaultValue: phase.labelKey })}
              </span>
            </div>

            {/* Connector line */}
            {idx < PHASES.length - 1 && (
              <div className="flex-1 mx-1.5 h-0.5 rounded-full overflow-hidden bg-border/40 min-w-[20px]">
                <motion.div
                  className={cn('h-full rounded-full', isDone ? 'bg-success' : isActive ? 'bg-primary/50' : 'bg-transparent')}
                  initial={{ width: '0%' }}
                  animate={{ width: isDone ? '100%' : isActive ? '50%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
