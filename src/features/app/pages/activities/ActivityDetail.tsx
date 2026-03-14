import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Timer, CheckCircle,
  Lightbulb, Play, BookOpen, ListChecks,
  ArrowRight, Shield, Radio, Clock, Star, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ACTIVITIES, categoryGradient } from '@/features/app/data/activities';
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
  const gradient = categoryGradient[activity.category] || 'from-primary/60 to-primary';

  const infoItems = [
    {
      label: t('games.detail.category'),
      value: t(`games.categories.${activity.category}`),
      icon: Icon,
      color: activity.color,
    },
    {
      label: t('games.detail.teamSize'),
      value: activity.teamSize,
      icon: Users,
      color: 'text-muted-foreground',
    },
    {
      label: t('games.detail.materials'),
      value: activity.materials || t('games.detail.materialsNone'),
      icon: Package,
      color: 'text-muted-foreground',
    },
    {
      label: t('games.detail.difficulty'),
      value:
        activity.difficulty === 'beginner'
          ? t('games.detail.difficultyBeginner')
          : activity.difficulty === 'intermediate'
            ? t('games.detail.difficultyIntermediate')
            : t('games.detail.difficultyAdvanced'),
      icon: Shield,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(ROUTES.GAMES)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
            {activity.i18nKey ? t(`${activity.i18nKey}.name`, { defaultValue: activity.name }) : activity.name}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5">
            {t(`games.categories.${activity.category}`)} ·{' '}
            {activity.type === 'sync'
              ? t('games.detail.typeSync')
              : t('games.detail.typeAsync')}{' '}
            · ⏱️ {activity.duration}
          </p>
        </div>
      </div>

      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={cn("h-1.5 w-full bg-gradient-to-r", gradient)} />
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className={cn("flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shrink-0", activity.bgColor)}>
              <Icon className={cn("h-5 w-5 sm:h-7 sm:w-7", activity.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] sm:text-[14px] text-foreground leading-relaxed">
                {activity.i18nKey
                  ? t(`${activity.i18nKey}.description`, { defaultValue: activity.description })
                  : activity.description}
              </p>
              <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-muted-foreground">
                  <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {activity.duration}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-muted-foreground">
                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {activity.teamSize}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-muted-foreground hidden sm:flex">
                  <Shield className="h-3.5 w-3.5" />{' '}
                  {activity.difficulty === 'beginner'
                    ? t('games.detail.difficultyBeginner')
                    : activity.difficulty === 'intermediate'
                      ? t('games.detail.difficultyIntermediate')
                      : t('games.detail.difficultyAdvanced')}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] sm:text-[10px] gap-0.5",
                    activity.type === 'sync'
                      ? 'border-primary/20 text-primary bg-primary/5'
                      : 'border-success/20 text-success bg-success/5'
                  )}
                >
                  {activity.type === 'sync' ? (
                    <>
                      <Radio className="h-2.5 w-2.5" /> {t('games.detail.badgeSync')}
                    </>
                  ) : (
                    <>
                      <Clock className="h-2.5 w-2.5" /> {t('games.detail.badgeAsync')}
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-5">
            {infoItems.map(item => (
              <div key={item.label} className="rounded-lg bg-muted/30 p-2.5 sm:p-3">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{item.label}</p>
                <p className="text-[11px] sm:text-[12px] font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <Separator className="my-4 sm:my-5" />

          {/* Why it works */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Lightbulb className="h-4 w-4 text-warning" />
              <h3 className="text-[13px] sm:text-[14px] font-semibold text-foreground">
                {t('games.detail.whyThisWorks')}
              </h3>
            </div>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed pl-6">{activity.whyItWorks}</p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button onClick={() => navigate(ROUTES.ACTIVITY_LAUNCH(id))} className="h-10 px-6 text-[13px] gap-2 shadow-sm">
              <Play className="h-4 w-4" /> {t('games.detail.launchActivity')}
            </Button>
            <Button variant="outline" className="h-10 px-5 text-[13px]">
              <BookOpen className="h-4 w-4 mr-2" /> {t('games.detail.saveToLibrary')}
            </Button>
          </div>
        </div>
      </div>

      {/* How to Run It */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {[
          { key: 'before', label: t('games.detail.sectionBefore'), items: activity.before, icon: ListChecks, color: 'text-info', bg: 'bg-info/10', gradient: 'from-info/60 to-info', ItemIcon: CheckCircle },
          { key: 'during', label: t('games.detail.sectionDuring'), items: activity.during, icon: Play, color: 'text-success', bg: 'bg-success/10', gradient: 'from-success/60 to-success', ItemIcon: null },
          { key: 'after', label: t('games.detail.sectionAfter'), items: activity.after, icon: CheckCircle, color: 'text-warning', bg: 'bg-warning/10', gradient: 'from-warning/60 to-warning', ItemIcon: CheckCircle },
        ].map((section) => (
          <div key={section.key} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className={cn("h-1 w-full bg-gradient-to-r", section.gradient)} />
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className={cn("flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg", section.bg)}>
                  <section.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", section.color)} />
                </div>
                <h3 className="text-[12px] sm:text-[13px] font-semibold text-foreground">{section.label}</h3>
              </div>
              <div className="space-y-2 sm:space-y-2.5">
                {section.items.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 sm:gap-2.5">
                    {section.ItemIcon ? (
                      <section.ItemIcon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 shrink-0", section.color)} />
                    ) : (
                      <span className={cn("flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full text-[8px] sm:text-[9px] font-bold shrink-0 mt-0.5", section.bg, section.color)}>{i + 1}</span>
                    )}
                    <p className="text-[11px] sm:text-[12px] text-muted-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pro Tips */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 to-primary" />
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-primary/10">
              <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <h3 className="text-[12px] sm:text-[13px] font-semibold text-foreground">
              {t('games.detail.proTips')}
            </h3>
          </div>
          <div className="grid gap-2 sm:gap-2.5 md:grid-cols-2">
            {activity.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] sm:text-[12px] text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border border-primary/20 bg-primary/[0.03]">
        <div>
          <h3 className="text-[13px] sm:text-[14px] font-semibold text-foreground">
            {t('games.detail.readyTitle', {
              name: activity.i18nKey
                ? t(`${activity.i18nKey}.name`, { defaultValue: activity.name })
                : activity.name,
            })}
          </h3>
          <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5">
            {t('games.detail.readySubtitle')}
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.ACTIVITY_LAUNCH(id))} className="h-9 sm:h-10 px-5 sm:px-6 text-[12px] sm:text-[13px] gap-2 shadow-sm shrink-0">
          {t('games.detail.launchNow')} <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
