import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Users, Clock, Timer, Copy, Share2,
  CheckCircle, Link2, Radio, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LeaderboardSidebar } from './LeaderboardSidebar';
import { MobileBottomSheet } from './MobileBottomSheet';
import type { GameParticipant } from './types';
import { motion } from 'framer-motion';

type MobileTab = 'chat' | 'leaderboard';

interface GamePlayShellProps {
  title: string;
  subtitle: string;
  gameType: 'sync' | 'async';
  eventId: string;
  participants: GameParticipant[];
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  onEnd?: () => void;
  /** Current user ID (used to filter out own join toasts) */
  currentUserId?: string;
  /** Current user's display name (for header) */
  currentUserName?: string;
  /** Current user's avatar URL (for header) */
  currentUserAvatarUrl?: string | null;
  /** Opens the in-game profile editor */
  onEditProfile?: () => void;
  /** Company logo URL to display instead of default text */
  organizationLogo?: string;
  /** Company name for accessibility */
  organizationName?: string;
  /** Hide the back button if the user has already joined the game */
  hideBackButton?: boolean;
}

export function GamePlayShell({
  title, subtitle, gameType, eventId, participants, children, sidebar, onEnd,
  currentUserId, currentUserName, currentUserAvatarUrl, onEditProfile,
  organizationLogo, organizationName, hideBackButton,
}: GamePlayShellProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileTab | null>(null);
  const copyLinkTimeoutRef = useRef<NodeJS.Timeout>();

  const joinedCount = participants.filter(p => p.status === 'joined').length;
  const pendingCount = participants.filter(p => p.status === 'pending').length;
  const totalInvited = participants.length;
  const joinLink = `${window.location.origin}/join/${eventId}`;
  const joinPct = totalInvited > 0 ? Math.round((joinedCount / totalInvited) * 100) : 0;

  const isLobby = joinedCount < 2;
  const sessionStatusLabel =
    gameType === 'sync'
      ? (isLobby
          ? t('gamePlay.shell.statusWaiting', 'Waiting for your team')
          : t('gamePlay.shell.statusLive', 'Live team session'))
      : t('gamePlay.shell.statusAsync', 'Async check‑in session');

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => {
      clearInterval(timer);
      if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
    };
  }, []);

  // Track previously joined participants to show toasts
  const prevJoinedIds = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const newlyJoined = participants.filter(p => 
      p.status === 'joined' && p.id !== currentUserId && !prevJoinedIds.current.has(p.id)
    );
    
    newlyJoined.forEach(p => {
      toast.success(`${p.name} joined the session! 🎉`, {
        description: t('gamePlay.shell.readyToConnect', 'Ready to connect!'),
        icon: '👋',
      });
      prevJoinedIds.current.add(p.id);
    });

    // Backfill any existing joined ones so we don't double-toast on normal re-renders
    participants.forEach(p => {
      if (p.status === 'joined') prevJoinedIds.current.add(p.id);
    });
  }, [participants, currentUserId, t]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink);
    if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
    setCopied(true);
    copyLinkTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const leaderboard = <LeaderboardSidebar participants={participants} />;

  return (
    <div className="space-y-5 w-full max-w-[1400px] mx-auto animate-fade-in">
      {/* ─── Header ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/5" />
        
        {/* Animated Background Orbs */}
        <motion.div 
          className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"
          animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-0 left-10 w-48 h-48 bg-info/10 rounded-full blur-[60px] pointer-events-none"
          animate={{ x: [0, 50, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {!hideBackButton && (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80" onClick={() => navigate(ROUTES.EVENTS)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              {/* Company Logo Display */}
              {organizationLogo && (
                <div className="flex items-center justify-center h-9 bg-background/30 backdrop-blur-sm rounded-lg px-2 border border-border/30 shrink-0">
                  <img src={organizationLogo} alt={organizationName || 'Company'} className="h-6 w-auto max-w-[100px] object-contain" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">{title}</h1>
                  <Badge className={cn("text-[10px] shrink-0 gap-1",
                    gameType === 'sync' ? 'bg-success/15 text-success border-success/25' : 'bg-info/15 text-info border-info/25'
                  )}>
                    {gameType === 'sync'
                      ? (<><div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> {t('gamePlay.shell.liveSession', 'Live session')}</>)
                      : (<><Radio className="h-2.5 w-2.5" /> {t('gamePlay.shell.asyncSession', 'Async session')}</>)}
                  </Badge>
                </div>
                <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5 sm:mt-1">{subtitle}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide border",
                    isLobby
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-primary/40 bg-primary/10 text-primary"
                  )}>
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isLobby ? "bg-warning animate-pulse" : "bg-primary"
                    )} />
                    {sessionStatusLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Current user's profile pill */}
              {(currentUserAvatarUrl || currentUserName) && (
                <button
                  onClick={onEditProfile}
                  title="Edit your profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 transition-colors group"
                >
                  {currentUserAvatarUrl ? (
                    <img src={currentUserAvatarUrl} alt="You" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                      {(currentUserName || 'You').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-foreground max-w-[80px] truncate hidden sm:inline">{currentUserName || 'You'}</span>
                  <Pencil className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowLink(!showLink)} className="h-8 sm:h-9 text-[11px] sm:text-[12px] gap-1.5 rounded-xl">
                <Share2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('gamePlay.shell.invite')}</span>
              </Button>
              <Button variant="destructive" size="sm" className="h-8 sm:h-9 text-[11px] sm:text-[12px] rounded-xl" onClick={onEnd || (() => navigate(ROUTES.EVENTS))}>
                {t('gamePlay.shell.end')}
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-3 sm:gap-6 mt-4 sm:mt-5 flex-wrap">
            <StatItem icon={Timer} value={formatTime(elapsed)} label={t('gamePlay.shell.duration')} color="primary" />
            <div className="h-7 sm:h-8 w-px bg-border" />
            <StatItem icon={Users} value={<>{joinedCount}<span className="text-muted-foreground text-[11px] sm:text-[12px] font-normal">/{totalInvited}</span></>} label={t('gamePlay.shell.joined')} color="success" />
            <div className="h-7 sm:h-8 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-foreground leading-none">{pendingCount}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{t('gamePlay.shell.pending')}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden lg:block" />
            <div className="flex-1 min-w-[120px] hidden lg:block">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium">{t('gamePlay.shell.participation')}</span>
                <span className="text-[10px] font-bold text-foreground">{joinPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700" style={{ width: `${joinPct}%` }} />
              </div>
            </div>
            <div className="flex -space-x-2 ml-auto sm:ml-0">
              {participants.filter(p => p.status === 'joined').slice(0, 4).map((p, i) => (
                <Avatar key={p.id} className="h-6 w-6 sm:h-7 sm:w-7 ring-2 ring-card" style={{ zIndex: 5 - i }}>
                  {(p as any).avatarUrl && <AvatarImage src={(p as any).avatarUrl} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-[7px] sm:text-[8px] font-bold">{p.avatar}</AvatarFallback>
                </Avatar>
              ))}
              {joinedCount > 4 && (
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-muted text-[8px] sm:text-[9px] font-bold text-muted-foreground ring-2 ring-card">
                  +{joinedCount - 4}
                </div>
              )}
            </div>
          </div>
        </div>

        {showLink && (
          <div className="border-t border-border px-4 sm:px-5 py-3 bg-muted/30 flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                value={joinLink}
                readOnly
                className="h-8 text-[11px] sm:text-[12px] bg-background/60 flex-1 min-w-0 border-border/50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyLink}
                className="h-8 text-[11px] gap-1 shrink-0 rounded-lg"
              >
                {copied ? <CheckCircle className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                {copied ? t('gamePlay.shell.copied') : t('gamePlay.shell.copy')}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t(
                'gamePlay.shell.inviteHelp',
                'Share this link with teammates you want to bring into this session.'
              )}
            </p>
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">{children}</div>
        <div className="hidden lg:block space-y-4">
          {sidebar || leaderboard}
        </div>
      </div>

      {/* ─── Mobile Bottom Sheet ─── */}
      <MobileBottomSheet
        activeTab={mobileSheet}
        onToggle={(tab) => setMobileSheet(prev => prev === tab ? null : tab)}
        onClose={() => setMobileSheet(null)}
        chatContent={sidebar || leaderboard}
        leaderboardContent={leaderboard}
      />
      <div className="h-20 lg:hidden" />
    </div>
  );
}

/* ─── Stat item helper ─── */
function StatItem({ icon: Icon, value, label, color }: {
  icon: typeof Timer;
  value: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className={cn("flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg", `bg-${color}/10`)}>
        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", `text-${color}`)} />
      </div>
      <div>
        <p className="text-[14px] sm:text-[16px] font-bold text-foreground leading-none">{value}</p>
        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
