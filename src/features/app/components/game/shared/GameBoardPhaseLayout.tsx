import { Button } from '@/components/ui/button';
import { PhaseBadge, PhaseTimer, type GamePhase } from './index';

type Props = {
  phase: GamePhase;
  timeLeft?: number;
  maxTime?: number;
  onOpenHow?: () => void;
  howLabel?: string;
};

export function GameBoardPhaseLayout({ phase, timeLeft, maxTime, onOpenHow, howLabel }: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <PhaseBadge phase={phase} />
        {typeof timeLeft === 'number' && typeof maxTime === 'number' ? (
          <PhaseTimer timeLeft={timeLeft} maxTime={maxTime} />
        ) : null}
      </div>
      {onOpenHow ? (
        <Button variant="ghost" size="sm" className="h-8 text-[11px]" onClick={onOpenHow}>
          {howLabel || 'How this works'}
        </Button>
      ) : null}
    </div>
  );
}
