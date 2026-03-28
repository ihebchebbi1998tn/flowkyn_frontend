import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoundIndicatorProps {
  currentRound: number;
  totalRounds: number;
}

export function RoundIndicator({ currentRound, totalRounds }: RoundIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalRounds }).map((_, i) => (
        <div key={i} className={cn(
          "flex items-center justify-center transition-all duration-300",
          i + 1 === currentRound ? 'scale-110' : ''
        )}>
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border-2",
            i + 1 < currentRound && "bg-success/15 border-success/30 text-success",
            i + 1 === currentRound && "bg-primary/15 border-primary text-primary ring-4 ring-primary/10",
            i + 1 > currentRound && "bg-muted/50 border-border text-muted-foreground/40",
          )}>
            {i + 1 < currentRound ? <CheckCircle className="h-4 w-4" /> : i + 1}
          </div>
          {i < totalRounds - 1 && (
            <div className={cn("w-6 sm:w-10 h-[2px] ml-2",
              i + 1 < currentRound ? 'bg-success/40' : 'bg-border'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
