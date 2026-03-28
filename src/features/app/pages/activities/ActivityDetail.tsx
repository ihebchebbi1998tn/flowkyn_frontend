import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Timer, Play, Radio, Clock, Shield,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ACTIVITIES, categoryColors } from '@/features/app/data/activities';
import { ROUTES } from '@/constants/routes';

export default function ActivityDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

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

  const guideSections = [
    { key: 'before', label: t('games.detail.sectionBefore'), items: activity.before.slice(0, 3), color: 'text-info', bg: 'bg-info/8', accent: 'border-info/15' },
    { key: 'during', label: t('games.detail.sectionDuring'), items: activity.during.slice(0, 3), color: 'text-success', bg: 'bg-success/8', accent: 'border-success/15' },
    { key: 'after', label: t('games.detail.sectionAfter'), items: activity.after.slice(0, 2), color: 'text-warning', bg: 'bg-warning/8', accent: 'border-warning/15' },
  ];

  return (
    <div className="space-y-4 max-w-[960px]">
      {/* Back */}
      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground -ml-2" onClick={() => navigate(ROUTES.GAMES)}>
        <ArrowLeft className="h-3 w-3" /> {t('common.back', { defaultValue: 'Back' })}
      </Button>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-lg border border-border bg-card overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="w-full sm:w-56 shrink-0 relative overflow-hidden">
            {activity.image ? (
              <>
                <img src={activity.image} alt={name} className="w-full h-40 sm:h-full object-cover" />
                <div className="hidden sm:block absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent" />
              </>
            ) : (
              <div className="w-full h-40 sm:h-full bg-muted flex items-center justify-center">
                <Icon className="h-10 w-10 text-muted-foreground/15" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Badge variant="outline" className={cn('text-[9px] px-1.5 h-[18px] border', categoryColors[activity.category])}>
                  {t(`games.categories.${activity.category}`)}
                </Badge>
                <Badge variant="outline" className={cn(
                  'text-[9px] px-1.5 h-[18px] gap-0.5',
                  activity.type === 'sync' ? 'text-primary border-primary/20' : 'text-success border-success/20'
                )}>
                  {activity.type === 'sync' ? <><Radio className="h-2 w-2" /> Live</> : <><Clock className="h-2 w-2" /> Async</>}
                </Badge>
                {activity.popular && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-[9px] px-1.5 h-[18px] gap-0.5">
                    <Sparkles className="h-2 w-2" /> {t('games.popular', { defaultValue: 'Popular' })}
                  </Badge>
                )}
              </div>

              <h1 className="text-lg font-bold text-foreground tracking-tight mb-1">{name}</h1>
              <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
            </div>

            {/* Stats + CTA */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1.5">
                {[
                  { icon: Timer, value: activity.duration },
                  { icon: Users, value: activity.teamSize },
                  { icon: Shield, value: diffLabel },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                    <s.icon className="h-2.5 w-2.5 text-muted-foreground/60" /> {s.value}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate(ROUTES.ACTIVITY_LAUNCH(id))}
                className="h-8 px-4 text-xs gap-1.5 rounded-lg font-medium"
                disabled={isComingSoon}
              >
                <Play className="h-3 w-3" />
                {isComingSoon ? t('games.comingSoon.title', { defaultValue: 'Coming soon' }) : t('games.detail.launchActivity')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Guide — always visible, compact */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.06 }}
        className="grid gap-2.5 md:grid-cols-3"
      >
        {guideSections.map((section) => (
          <div key={section.key} className={cn("rounded-lg border bg-card p-3", section.accent)}>
            <h3 className={cn('text-[10px] font-semibold uppercase tracking-wider mb-2', section.color)}>
              {section.label}
            </h3>
            <ul className="space-y-1.5">
              {section.items.map((step, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className={cn('text-[8px] font-bold mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center shrink-0', section.bg, section.color)}>
                    {i + 1}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-snug">{step}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>

      {/* Tips — compact, always visible */}
      {activity.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.1 }}
          className="rounded-lg border border-primary/10 bg-card p-3"
        >
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
            {t('games.detail.proTips')}
          </h3>
          <div className="grid gap-1 sm:grid-cols-2">
            {activity.tips.slice(0, 4).map((tip, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug flex items-start gap-1.5">
                <span className="text-primary/40 mt-px text-[7px]">◆</span>
                {tip}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
