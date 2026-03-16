/**
 * @fileoverview Activity Card — premium card for the game/activity catalog.
 * Features gradient accent, hover lift, icon prominence, and metadata badges.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Timer, Users, ArrowRight, Radio, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import type { Activity } from '@/features/app/data/activities';
import { categoryColors, categoryGradient } from '@/features/app/data/activities';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const gradient = categoryGradient[activity.category] || 'from-primary/60 to-primary';
  const name = activity.i18nKey ? t(`${activity.i18nKey}.name`, { defaultValue: activity.name }) : activity.name;
  const description = activity.i18nKey ? t(`${activity.i18nKey}.description`, { defaultValue: activity.description }) : activity.description;
  const duration = activity.i18nKey ? t(`${activity.i18nKey}.duration`, { defaultValue: activity.duration }) : activity.duration;
  const teamSize = activity.i18nKey ? t(`${activity.i18nKey}.teamSize`, { defaultValue: activity.teamSize }) : activity.teamSize;
  const difficultyLabel = t(`games.filters.${activity.difficulty}`, { defaultValue: activity.difficulty });

  return (
    <button
      onClick={() => navigate(ROUTES.ACTIVITY_DETAIL(activity.id))}
      className="group relative rounded-2xl border border-border bg-card text-left overflow-hidden transition-all duration-300 w-full hover:border-primary/25 hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1"
    >
      {/* Top gradient accent */}
      <div className={cn("h-1 w-full bg-gradient-to-r opacity-30 group-hover:opacity-100 transition-opacity duration-500", gradient)} />

      <div className="p-5">
        {/* Icon + Title */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10",
            activity.bgColor
          )}>
            <activity.icon className={cn("h-5 w-5", activity.color)} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Badge variant="outline" className={cn("text-[9px] border h-[18px] px-1.5 font-medium rounded-md", categoryColors[activity.category])}>
                {t(`games.categories.${activity.category}`)}
              </Badge>
              <Badge variant="outline" className={cn("text-[9px] h-[18px] px-1.5 gap-0.5 font-medium rounded-md",
                activity.type === 'sync' ? 'border-primary/20 text-primary bg-primary/5' : 'border-success/20 text-success bg-success/5'
              )}>
                {activity.type === 'sync' ? <><Radio className="h-2 w-2" /> {t('common.live')}</> : <><Clock className="h-2 w-2" /> {t('common.async')}</>}
              </Badge>
              <Badge
                variant="outline"
                className="text-[9px] border h-[18px] px-1.5 font-medium rounded-md bg-muted/40 text-muted-foreground border-border/60"
              >
                {difficultyLabel}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-border/40">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-muted-foreground/50" />
              {duration}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
              {teamSize}
            </span>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent group-hover:bg-primary/10 transition-all duration-300">
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
          </div>
        </div>
      </div>
    </button>
  );
}
