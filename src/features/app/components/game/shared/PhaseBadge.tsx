import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type GamePhase = 'waiting' | 'submit' | 'vote' | 'reveal' | 'results' | 'matching' | 'chatting' | 'complete';

const PHASE_CONFIG: Record<GamePhase, { labelKey: string; emoji: string; className: string }> = {
  waiting:  { labelKey: 'gamePlay.phases.waiting',  emoji: '⏳', className: 'bg-muted text-muted-foreground' },
  submit:   { labelKey: 'gamePlay.phases.submit',   emoji: '✍️', className: 'bg-primary/10 text-primary border-primary/20' },
  vote:     { labelKey: 'gamePlay.phases.vote',     emoji: '🗳️', className: 'bg-warning/10 text-warning border-warning/20' },
  reveal:   { labelKey: 'gamePlay.phases.reveal',   emoji: '🎭', className: 'bg-info/10 text-info border-info/20' },
  results:  { labelKey: 'gamePlay.phases.results',  emoji: '🏆', className: 'bg-success/10 text-success border-success/20' },
  matching: { labelKey: 'gamePlay.phases.matching', emoji: '☕', className: 'bg-info/10 text-info border-info/20' },
  chatting: { labelKey: 'gamePlay.phases.chatting', emoji: '💬', className: 'bg-primary/10 text-primary border-primary/20' },
  complete: { labelKey: 'gamePlay.phases.complete', emoji: '✅', className: 'bg-success/10 text-success border-success/20' },
};

interface PhaseBadgeProps {
  phase: GamePhase;
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  const { t } = useTranslation();
  const config = PHASE_CONFIG[phase];
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize px-2.5 h-6", config.className)}>
      {config.emoji} {t(config.labelKey)}
    </Badge>
  );
}
