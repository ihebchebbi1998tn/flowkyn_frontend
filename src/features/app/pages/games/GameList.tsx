import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Timer, Users, ArrowRight, Radio, Clock, Zap, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { ACTIVITIES, categoryColors } from '@/features/app/data/activities';
import type { Activity } from '@/features/app/data/activities';

/* ─── Category-specific hover glow colors ─── */
const categoryGlow: Record<string, string> = {
  icebreaker: 'hsl(265 87% 58% / 0.12)',
  connection: 'hsl(217 91% 60% / 0.12)',
  wellness: 'hsl(38 92% 50% / 0.10)',
  competition: 'hsl(0 84% 60% / 0.10)',
};

const categoryBorderHover: Record<string, string> = {
  icebreaker: 'hsl(265 87% 58% / 0.25)',
  connection: 'hsl(217 91% 60% / 0.25)',
  wellness: 'hsl(38 92% 50% / 0.20)',
  competition: 'hsl(0 84% 60% / 0.20)',
};

function GameCard({ activity, index }: { activity: Activity; index: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const name = activity.i18nKey ? t(`${activity.i18nKey}.name`, { defaultValue: activity.name }) : activity.name;
  const description = activity.i18nKey ? t(`${activity.i18nKey}.description`, { defaultValue: activity.description }) : activity.description;
  const duration = activity.i18nKey ? t(`${activity.i18nKey}.duration`, { defaultValue: activity.duration }) : activity.duration;
  const teamSize = activity.i18nKey ? t(`${activity.i18nKey}.teamSize`, { defaultValue: activity.teamSize }) : activity.teamSize;

  const glowColor = categoryGlow[activity.category] || categoryGlow.icebreaker;
  const borderHover = categoryBorderHover[activity.category] || categoryBorderHover.icebreaker;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={() => navigate(ROUTES.ACTIVITY_DETAIL(activity.id))}
        className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-all duration-200 w-full"
        style={{ boxShadow: '0 1px 2px hsl(var(--foreground) / 0.03)' }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = `0 4px 16px ${glowColor}, 0 8px 32px hsl(var(--foreground) / 0.04)`;
          el.style.borderColor = borderHover;
          el.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = '0 1px 2px hsl(var(--foreground) / 0.03)';
          el.style.borderColor = '';
          el.style.transform = 'translateY(0)';
        }}
      >
        {/* Image area */}
        <div className="relative h-44 overflow-hidden">
          {activity.image ? (
            <img
              src={activity.image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              width={800}
              height={512}
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <activity.icon className="h-10 w-10 text-muted-foreground/15" />
            </div>
          )}

          {/* Bottom gradient fade into card */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/60 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <Badge className={cn("text-[10px] font-medium border backdrop-blur-md", categoryColors[activity.category])}>
              {t(`games.categories.${activity.category}`)}
            </Badge>
            <Badge variant="outline" className={cn(
              "text-[10px] font-medium gap-1 backdrop-blur-md border",
              activity.type === 'sync'
                ? 'text-primary border-primary/20 bg-primary/10'
                : 'text-success border-success/20 bg-success/10'
            )}>
              {activity.type === 'sync'
                ? <><Radio className="h-2.5 w-2.5" /> Live</>
                : <><Clock className="h-2.5 w-2.5" /> Async</>
              }
            </Badge>
          </div>

          {activity.popular && (
            <div className="absolute top-2.5 right-2.5">
              <Badge className="bg-primary text-primary-foreground border-0 text-[10px] font-semibold gap-1">
                <Zap className="h-2.5 w-2.5" /> {t('games.popular', { defaultValue: 'Popular' })}
              </Badge>
            </div>
          )}

          {/* Hover play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="h-11 w-11 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-100 scale-90"
              style={{ boxShadow: `0 4px 20px ${glowColor}` }}
            >
              <Play className="h-4.5 w-4.5 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 pt-1">
          <h3 className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors duration-150 mb-1 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {name}
          </h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
            {description}
          </p>

          <div className="flex items-center justify-between pt-2.5 border-t border-border/40">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded">
                <Timer className="h-3 w-3 text-muted-foreground/60" /> {duration}
              </span>
              <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded">
                <Users className="h-3 w-3 text-muted-foreground/60" /> {teamSize}
              </span>
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/6 group-hover:bg-primary/12 transition-colors duration-150">
              <ArrowRight className="h-3 w-3 text-primary/50 group-hover:text-primary transition-all duration-150 group-hover:translate-x-0.5 transform" />
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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {t('games.title', { defaultValue: 'Activities' })}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {t('games.subtitle', { defaultValue: 'Pick an activity to run with your team' })}
        </p>
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
        transition={{ delay: 0.4 }}
        className="text-center mt-10 text-[11px] text-muted-foreground/50 font-medium uppercase tracking-widest"
      >
        {t('games.moreComingSoon', { defaultValue: 'More activities coming soon' })}
      </motion.p>
    </div>
  );
}
