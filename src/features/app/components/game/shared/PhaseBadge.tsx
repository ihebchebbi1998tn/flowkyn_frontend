import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  Pencil,
  Radio,
  Sparkles,
  Trophy,
  Coffee,
  MessageCircle,
  CheckCircle,
  Settings2,
  Users,
  GraduationCap,
} from 'lucide-react';

export type GamePhase = 'waiting' | 'submit' | 'vote' | 'reveal' | 'results' | 'matching' | 'chatting' | 'complete' | 'setup' | 'roles_assignment' | 'discussion' | 'debrief';

const PHASE_CONFIG: Record<
  GamePhase,
  { labelKey: string; icon: React.ElementType; className: string }
> = {
  waiting: { labelKey: 'gamePlay.phases.waiting', icon: Clock, className: 'bg-muted text-muted-foreground' },
  submit: { labelKey: 'gamePlay.phases.submit', icon: Pencil, className: 'bg-primary/10 text-primary border-primary/20' },
  vote: { labelKey: 'gamePlay.phases.vote', icon: Radio, className: 'bg-warning/10 text-warning border-warning/20' },
  reveal: { labelKey: 'gamePlay.phases.reveal', icon: Sparkles, className: 'bg-info/10 text-info border-info/20' },
  results: { labelKey: 'gamePlay.phases.results', icon: Trophy, className: 'bg-success/10 text-success border-success/20' },
  matching: { labelKey: 'gamePlay.phases.matching', icon: Coffee, className: 'bg-info/10 text-info border-info/20' },
  chatting: { labelKey: 'gamePlay.phases.chatting', icon: MessageCircle, className: 'bg-primary/10 text-primary border-primary/20' },
  complete: { labelKey: 'gamePlay.phases.complete', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
  setup: { labelKey: 'strategic.phases.setup', icon: Settings2, className: 'bg-muted text-muted-foreground' },
  roles_assignment: { labelKey: 'strategic.phases.rolesAssignment', icon: Users, className: 'bg-primary/10 text-primary border-primary/20' },
  discussion: { labelKey: 'strategic.phases.discussion', icon: MessageCircle, className: 'bg-primary/10 text-primary border-primary/20' },
  debrief: { labelKey: 'strategic.phases.debrief', icon: GraduationCap, className: 'bg-success/10 text-success border-success/20' },
};

interface PhaseBadgeProps {
  phase: GamePhase;
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  const { t } = useTranslation();
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] capitalize px-2.5 h-6 flex items-center gap-1", config.className)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {t(config.labelKey)}
    </Badge>
  );
}
