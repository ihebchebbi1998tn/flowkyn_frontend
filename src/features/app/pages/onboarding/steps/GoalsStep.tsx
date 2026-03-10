/**
 * @fileoverview Onboarding Step 2 — Goals Selection
 *
 * Users select one or more goals for using the platform.
 * At least one goal must be selected to proceed.
 */

import { useTranslation } from 'react-i18next';
import { Check, Users, Sparkles, Heart, Globe, Rocket, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t('onboarding.goalsHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {GOAL_KEYS.map((key) => {
          const Icon = GOAL_ICONS[key];
          const selected = data.goals.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleGoal(key)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm",
                selected ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors",
                selected ? 'bg-primary/15' : 'bg-muted'
              )}>
                <Icon className={cn("h-4 w-4", selected ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", selected ? 'text-primary' : 'text-foreground')}>
                    {t(`onboarding.goals.${key}.label`)}
                  </span>
                  {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {t(`onboarding.goals.${key}.description`)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {data.goals.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] text-muted-foreground">{t('onboarding.selected')}</span>
          {data.goals.map(g => (
            <Badge key={g} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
              {t(`onboarding.goals.${g}.label`)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
