import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Timer, Users, ArrowRight, Radio, Clock, Zap, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { ACTIVITIES, categoryColors } from '@/features/app/data/activities';
import type { Activity } from '@/features/app/data/activities';

function GameCard({ activity, index }: { activity: Activity; index: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const name = activity.i18nKey ? t(`${activity.i18nKey}.name`, { defaultValue: activity.name }) : activity.name;
  const description = activity.i18nKey ? t(`${activity.i18nKey}.description`, { defaultValue: activity.description }) : activity.description;
  const duration = activity.i18nKey ? t(`${activity.i18nKey}.duration`, { defaultValue: activity.duration }) : activity.duration;
  const teamSize = activity.i18nKey ? t(`${activity.i18nKey}.teamSize`, { defaultValue: activity.teamSize }) : activity.teamSize;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={() => navigate(ROUTES.ACTIVITY_DETAIL(activity.id))}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-300 hover:border-primary/25 w-full"
        style={{
          boxShadow: '0 1px 3px hsl(var(--foreground) / 0.03)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 8px 24px hsl(var(--primary) / 0.08), 0 4px 12px hsl(var(--foreground) / 0.04)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px hsl(var(--foreground) / 0.03)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Image with overlay */}
        <div className="relative h-48 overflow-hidden">
          {activity.image ? (
            <img
              src={activity.image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              loading="lazy"
              width={800}
              height={512}
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <activity.icon className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge className={cn("text-[10px] font-semibold border backdrop-blur-md bg-opacity-90", categoryColors[activity.category])}>
              {t(`games.categories.${activity.category}`)}
            </Badge>
            <Badge variant="outline" className={cn(
              "text-[10px] font-semibold gap-1 backdrop-blur-md",
              activity.type === 'sync'
                ? 'text-primary border-primary/25 bg-primary/10'
                : 'text-success border-success/25 bg-success/10'
            )}>
              {activity.type === 'sync'
                ? <><Radio className="h-2.5 w-2.5" /> Live</>
                : <><Clock className="h-2.5 w-2.5" /> Async</>
              }
            </Badge>
          </div>

          {activity.popular && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary text-primary-foreground border-0 text-[10px] font-bold gap-1 shadow-md">
                <Zap className="h-2.5 w-2.5" /> Popular
              </Badge>
            </div>
          )}

          {/* Hover play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="h-12 w-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-100 scale-75">
              <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors duration-200 mb-1 tracking-tight">
            {name}
          </h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
            {description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
                <Timer className="h-3 w-3 text-muted-foreground/70" /> {duration}
              </span>
              <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
                <Users className="h-3 w-3 text-muted-foreground/70" /> {teamSize}
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors duration-200">
              <ArrowRight className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors duration-200 group-hover:translate-x-0.5 transform" />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

export default function GameList() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {t('games.title', { defaultValue: 'Activities' })}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('games.subtitle', { defaultValue: 'Pick an activity to run with your team' })}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {ACTIVITIES.map((activity, i) => (
          <GameCard key={activity.id} activity={activity} index={i} />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-10 text-[11px] text-muted-foreground/60 font-medium uppercase tracking-widest"
      >
        {t('games.moreComingSoon', { defaultValue: 'More activities coming soon' })}
      </motion.p>
    </div>
  );
}
