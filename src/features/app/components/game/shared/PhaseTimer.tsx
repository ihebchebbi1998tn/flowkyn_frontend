import { cn } from '@/lib/utils';

interface PhaseTimerProps {
  timeLeft: number;
  maxTime: number;
}

export function PhaseTimer({ timeLeft, maxTime }: PhaseTimerProps) {
  const pct = (timeLeft / maxTime) * 100;
  const color = timeLeft <= 5 ? 'text-destructive' : timeLeft <= 10 ? 'text-warning' : 'text-primary';
  const strokeColor = timeLeft <= 5 ? 'hsl(var(--destructive))' : timeLeft <= 10 ? 'hsl(var(--warning))' : 'hsl(var(--primary))';

  return (
    <div className="relative h-10 w-10">
      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
          className="transition-all duration-1000" />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-[12px] font-bold tabular-nums", color)}>
        {timeLeft}
      </span>
    </div>
  );
}
