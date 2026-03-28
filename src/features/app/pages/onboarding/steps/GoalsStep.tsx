import { useTranslation } from 'react-i18next';
import { Check, Users, Sparkles, Heart, Globe, Rocket, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '../types';

const GOAL_ICONS: Record<string, React.ElementType> = {
  team_bonding: Users, icebreakers: Sparkles, engagement: Heart,
  remote_culture: Globe, onboarding: Rocket, wellness: Shield,
};
const GOAL_KEYS = ['team_bonding', 'icebreakers', 'engagement', 'remote_culture', 'onboarding', 'wellness'];

interface GoalsStepProps {
  data: OnboardingData;
  onToggleGoal: (key: string) => void;
}

export function GoalsStep({ data, onToggleGoal }: GoalsStepProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {GOAL_KEYS.map((key) => {
        const Icon = GOAL_ICONS[key];
        const selected = data.goals.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggleGoal(key)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
              selected ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-border hover:bg-accent/20'
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
              selected ? 'bg-primary/10' : 'bg-muted/60'
            )}>
              <Icon className={cn("h-4 w-4", selected ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <span className={cn("text-sm font-medium flex-1", selected ? 'text-primary' : 'text-foreground/80')}>
              {t(`onboarding.goals.${key}.label`)}
            </span>
            {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
