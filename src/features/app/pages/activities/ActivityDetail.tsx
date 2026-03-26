import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Timer, Play, Radio, Clock, Shield,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ACTIVITIES, categoryColors } from '@/features/app/data/activities';
import { ROUTES } from '@/constants/routes';

export default function ActivityDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  const activity = ACTIVITIES.find(a => a.id === id);
  if (!activity) {
    navigate(ROUTES.GAMES);
    return null;
  }

  const Icon = activity.icon;
  const isComingSoon = !!activity.comingSoon;

  const name = activity.i18nKey ? t(`${activity.i18nKey}.name`, { defaultValue: activity.name }) : activity.name;
  const description = activity.i18nKey ? t(`${activity.i18nKey}.description`, { defaultValue: activity.description }) : activity.description;

  const diffLabel = activity.difficulty === 'beginner'
    ? t('games.detail.difficultyBeginner')
    : activity.difficulty === 'intermediate'
      ? t('games.detail.difficultyIntermediate')
      : t('games.detail.difficultyAdvanced');

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground -ml-2" onClick={() => navigate(ROUTES.GAMES)}>
        <ArrowLeft className="h-3 w-3" /> {t('common.back', { defaultValue: 'Back' })}
      </Button>

      {/* Hero — compact card */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="w-full sm:w-56 shrink-0">
            {activity.image ? (
              <img src={activity.image} alt={name} className="w-full h-40 sm:h-full object-cover" />
            ) : (
              <div className="w-full h-40 sm:h-full bg-muted flex items-center justify-center">
                <Icon className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Badge variant="outline" className={cn('text-[9px] px-1.5 h-4 border', categoryColors[activity.category])}>
                  {t(`games.categories.${activity.category}`)}
                </Badge>
                <Badge variant="outline" className={cn(
                  'text-[9px] px-1.5 h-4 gap-0.5',
                  activity.type === 'sync' ? 'text-primary border-primary/20' : 'text-success border-success/20'
                )}>
                  {activity.type === 'sync' ? <><Radio className="h-2 w-2" /> Live</> : <><Clock className="h-2 w-2" /> Async</>}
                </Badge>
                {activity.popular && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-[9px] px-1.5 h-4">Popular</Badge>
                )}
              </div>

              <h1 className="text-lg font-semibold text-foreground tracking-tight mb-1">{name}</h1>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Timer, value: activity.duration },
                { icon: Users, value: activity.teamSize },
                { icon: Shield, value: diffLabel },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  <s.icon className="h-3 w-3" /> {s.value}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate(ROUTES.ACTIVITY_LAUNCH(id))}
                className="h-8 px-4 text-xs gap-1.5"
                disabled={isComingSoon}
              >
                <Play className="h-3.5 w-3.5" />
                {isComingSoon ? t('games.comingSoon.title', { defaultValue: 'Coming soon' }) : t('games.detail.launchActivity')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Why it works — one-liner */}
      {activity.whyItWorks && (
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-start gap-2.5">
          <div className="h-6 w-6 rounded bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="h-3 w-3 text-warning" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{activity.whyItWorks}</p>
        </div>
      )}

      {/* Facilitator Guide — collapsible */}
      <button
        type="button"
        onClick={() => setShowGuide(v => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <span className="font-medium">{t('games.detail.facilitatorGuide', { defaultValue: 'Facilitator guide' })}</span>
        {showGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        <div className="flex-1 h-px bg-border" />
      </button>

      {showGuide && (
        <div className="grid gap-3 md:grid-cols-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {[
            { key: 'before', label: t('games.detail.sectionBefore'), items: activity.before, color: 'text-info', bg: 'bg-info/10' },
            { key: 'during', label: t('games.detail.sectionDuring'), items: activity.during, color: 'text-success', bg: 'bg-success/10' },
            { key: 'after', label: t('games.detail.sectionAfter'), items: activity.after, color: 'text-warning', bg: 'bg-warning/10' },
          ].map((section) => (
            <div key={section.key} className="rounded-lg border border-border bg-card p-3">
              <h3 className={cn('text-[11px] font-semibold uppercase tracking-wider mb-2', section.color)}>
                {section.label}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className={cn('text-[9px] font-bold mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0', section.bg, section.color)}>
                      {i + 1}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Tips — collapsed inside guide */}
      {showGuide && activity.tips.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3 animate-in fade-in-0 duration-200">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
            {t('games.detail.proTips')}
          </h3>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {activity.tips.map((tip, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <span className="text-primary/60 mt-0.5">•</span>
                {tip}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
