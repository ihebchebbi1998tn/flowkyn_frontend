/**
 * @fileoverview Onboarding Step 5 — Team Pulse Survey
 *
 * HR collects baseline team health metrics:
 * - Team connectivity rating (1-10)
 * - Relationship quality rating (1-10)
 * - How well people know each other (1-10)
 * - What they expect from the app (free text)
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Users, Handshake, MessageSquareText } from 'lucide-react';
import type { OnboardingData } from '../types';

interface TeamPulseStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

const RATING_QUESTIONS = [
  {
    key: 'teamConnectedness' as const,
    icon: Users,
    gradient: 'from-blue-500/15 to-cyan-500/15',
    iconColor: 'text-blue-500',
    activeColor: 'text-blue-600',
  },
  {
    key: 'relationshipQuality' as const,
    icon: Heart,
    gradient: 'from-rose-500/15 to-pink-500/15',
    iconColor: 'text-rose-500',
    activeColor: 'text-rose-600',
  },
  {
    key: 'teamFamiliarity' as const,
    icon: Handshake,
    gradient: 'from-amber-500/15 to-orange-500/15',
    iconColor: 'text-amber-500',
    activeColor: 'text-amber-600',
  },
] as const;

function getRatingLabel(value: number, t: (key: string) => string): string {
  if (value <= 3) return t('onboarding.pulse.levels.low');
  if (value <= 6) return t('onboarding.pulse.levels.moderate');
  if (value <= 8) return t('onboarding.pulse.levels.good');
  return t('onboarding.pulse.levels.excellent');
}

function getRatingColor(value: number): string {
  if (value <= 3) return 'text-red-500';
  if (value <= 6) return 'text-amber-500';
  if (value <= 8) return 'text-emerald-500';
  return 'text-primary';
}

export function TeamPulseStep({ data, onChange }: TeamPulseStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground text-center">
        {t('onboarding.pulse.hint')}
      </p>

      {/* Rating sliders */}
      <div className="space-y-5">
        {RATING_QUESTIONS.map((q, idx) => {
          const Icon = q.icon;
          const value = data[q.key];
          return (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.35 }}
              className="rounded-xl border border-border bg-card/50 p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-gradient-to-br',
                  q.gradient
                )}>
                  <Icon className={cn('h-4 w-4', q.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {t(`onboarding.pulse.${q.key}.label`)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t(`onboarding.pulse.${q.key}.description`)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn('text-xl font-bold tabular-nums', getRatingColor(value))}>
                    {value}
                  </span>
                  <span className="text-[10px] text-muted-foreground">/10</span>
                </div>
              </div>

              <div className="px-1">
                <Slider
                  value={[value]}
                  onValueChange={([v]) => onChange({ [q.key]: v })}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">1</span>
                  <span className={cn('text-[10px] font-medium', getRatingColor(value))}>
                    {getRatingLabel(value, t)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">10</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expectations textarea */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="rounded-xl border border-border bg-card/50 p-4"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-gradient-to-br from-primary/15 to-primary/5">
            <MessageSquareText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {t('onboarding.pulse.expectations.label')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t('onboarding.pulse.expectations.description')}
            </p>
          </div>
        </div>
        <Textarea
          value={data.expectations}
          onChange={(e) => onChange({ expectations: e.target.value })}
          placeholder={t('onboarding.pulse.expectations.placeholder')}
          className="resize-none min-h-[80px] text-sm"
          maxLength={500}
        />
        <p className="text-[10px] text-muted-foreground text-right mt-1">
          {data.expectations.length}/500
        </p>
      </motion.div>
    </div>
  );
}
