import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Calendar, Users, Sparkles, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import logoFull from '@/assets/flowkyn-logo-full.png';

interface WelcomeHeroProps {
  userName: string;
  activeSessions: number;
  totalEvents: number;
  teamMembers: number;
}

export function WelcomeHero({ userName, activeSessions, totalEvents, teamMembers }: WelcomeHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning', 'Good morning');
    if (h < 18) return t('dashboard.goodAfternoon', 'Good afternoon');
    return t('dashboard.goodEvening', 'Good evening');
  };

  const quickActions = [
    {
      label: t('dashboard.launchActivity', 'Launch Activity'),
      description: t('dashboard.launchActivityDesc', 'Start a game'),
      icon: Zap,
      onClick: () => navigate(ROUTES.GAMES),
      accent: 'primary' as const,
    },
    {
      label: t('dashboard.createEvent', 'Create Event'),
      description: t('dashboard.createEventDesc', 'Schedule new'),
      icon: Calendar,
      onClick: () => navigate(ROUTES.EVENT_NEW),
      accent: 'info' as const,
    },
    {
      label: t('dashboard.viewTeam', 'View Team'),
      description: t('dashboard.viewTeamDesc', 'Manage members'),
      icon: Users,
      onClick: () => navigate(ROUTES.ORGANIZATIONS),
      accent: 'success' as const,
    },
  ];

  const accentClasses = {
    primary: 'bg-primary/8 text-primary hover:bg-primary/12 border-primary/15 hover:border-primary/25',
    info: 'bg-info/8 text-info hover:bg-info/12 border-info/15 hover:border-info/25',
    success: 'bg-success/8 text-success hover:bg-success/12 border-success/15 hover:border-success/25',
  };

  const iconBgClasses = {
    primary: 'bg-primary/15',
    info: 'bg-info/15',
    success: 'bg-success/15',
  };

  const summaryStats = [
    { label: t('dashboard.activeSessions', 'Active'), value: activeSessions, color: 'text-success' },
    { label: t('dashboard.totalEvents', 'Events'), value: totalEvents, color: 'text-primary' },
    { label: t('dashboard.teamMembers', 'Members'), value: teamMembers, color: 'text-info' },
  ];

  return (
    <motion.div
      className="relative rounded-xl border border-border/60 bg-card overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Gradient accent top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary-glow to-primary/20" />

      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-72 h-36 bg-primary/[0.03] blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-24 bg-info/[0.02] blur-3xl rounded-full pointer-events-none" />

      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        {/* Top row: Greeting + logo */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary/50" />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.15em]">
                {t('dashboard.welcome', 'Welcome back')}
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {greeting()}, {userName}
            </h1>
            <p className="text-[12px] text-muted-foreground mt-1.5 flex items-center gap-2">
              {activeSessions > 0 ? (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span>{t('dashboard.activeSessionsCount', '{{count}} active session(s)', { count: activeSessions })}</span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/20" />
                  <span>{t('dashboard.noActiveSessions', 'No active sessions right now')}</span>
                </>
              )}
            </p>
          </div>

          {/* Logo watermark */}
          <div className="hidden sm:block shrink-0 opacity-[0.07]">
            <img src={logoFull} alt="" className="h-16 w-auto object-contain" aria-hidden="true" />
          </div>
        </div>

        {/* Quick actions row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              onClick={action.onClick}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 + i * 0.05 }}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 group/action',
                accentClasses[action.accent]
              )}
            >
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-transform group-hover/action:scale-110', iconBgClasses[action.accent])}>
                <action.icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-[12px] font-semibold truncate">{action.label}</p>
                <p className="text-[10px] opacity-60 truncate">{action.description}</p>
              </div>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover/action:opacity-60 transition-opacity shrink-0 hidden sm:block" />
            </motion.button>
          ))}
        </div>

        {/* Summary stats bar */}
        <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-border/40">
          {summaryStats.map(stat => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className={cn('text-[15px] font-bold', stat.color)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
