import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Bug, Clock, Copy, CheckCircle2, Gamepad2, Share2, Users, WifiOff } from 'lucide-react';
import { PageSkeleton } from '@/components/loading/PageSkeleton';
import { LanguageSelector } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { ReportIssueModal } from '@/features/app/pages/support/ReportIssueModal';
import { copyToClipboard } from '@/utils/clipboard';
import type { GameParticipant } from '@/features/app/components/game/shell/types';
import { GameHeaderContext, type GameHeaderState } from './gameHeaderContext';

/**
 * Focused layout for game/event experiences.
 * No sidebar, no topbar — just a minimal branded header
 * with a back button and the game content.
 */

export function FocusedLayout() {
  const { t } = useTranslation();
  const [header, setHeader] = useState<GameHeaderState | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('game');

  const joinedCount = header?.participants.filter(p => p.status === 'joined').length ?? 0;
  const pendingCount = header?.participants.filter(p => p.status === 'pending').length ?? 0;
  const totalInvited = header?.participants.length ?? 0;
  const joinedParticipants = useMemo(
    () => header?.participants.filter(p => p.status === 'joined') ?? [],
    [header?.participants]
  );
  const joinLink = useMemo(() => {
    if (!header?.eventId) return '';
    return `${window.location.origin}/join/${header.eventId}${gameId ? `?game=${gameId}` : ''}`;
  }, [header?.eventId, gameId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Timer only while the game header is active.
  useEffect(() => {
    if (!header) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [header?.eventId]);

  useEffect(() => {
    // Reset whenever a new game header starts.
    if (header) setElapsed(0);
  }, [header?.eventId]);

  const copyLink = async () => {
    if (!joinLink) return;
    const success = await copyToClipboard(joinLink);
    if (success) {
      if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
      setCopied(true);
      copyLinkTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  const showGameHeader = !!header;

  return (
    <GameHeaderContext.Provider value={{ header, setHeader }}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-end px-4 sm:px-6 h-14 max-w-[1600px] mx-auto w-full">
            {!showGameHeader ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Gamepad2 className="h-4 w-4" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">{t('layout.liveExperience')}</span>
                </div>
                <LanguageSelector align="end" />
              </div>
            ) : (
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {!header?.hideBackButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-xl"
                      onClick={() => window.location.assign(ROUTES.EVENTS)}
                      aria-label={t('gamePlay.shell.back', { defaultValue: 'Back' })}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-lg bg-background/40 backdrop-blur-sm border border-border/40 hover:bg-background/70"
                    onClick={() => setIsReportOpen(true)}
                    title={t('support.reportBugCta', { defaultValue: 'Report a bug' })}
                  >
                    <Bug className="h-3.5 w-3.5" />
                  </Button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">{header?.title}</h1>
                      <Badge
                        className={cn(
                          'text-[10px] shrink-0 gap-1',
                          header.gameType === 'sync'
                            ? 'bg-success/15 text-success border-success/25'
                            : 'bg-info/15 text-info border-info/25'
                        )}
                      >
                        {header.gameType === 'sync'
                          ? t('gamePlay.shell.liveSession', 'Live session')
                          : t('gamePlay.shell.asyncSession', 'Async session')}
                      </Badge>
                      {!!header.disconnectedBadgeCount && header.disconnectedBadgeCount > 0 && (
                        <Badge className="text-[10px] shrink-0 gap-1 bg-destructive/15 text-destructive border-destructive/25">
                          <WifiOff className="h-2.5 w-2.5" />
                          {t('gamePlay.shell.userDisconnectedBadge', {
                            count: header.disconnectedBadgeCount,
                            defaultValue_one: '{{count}} user disconnected',
                            defaultValue_other: '{{count}} users disconnected',
                          })}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">{header.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(header.currentUserAvatarUrl || header.currentUserName) && (
                    <button
                      onClick={header.onEditProfile}
                      title={t('profile.editTitle', { defaultValue: 'Edit your profile' })}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 transition-colors group"
                    >
                      {header.currentUserAvatarUrl ? (
                        <img
                          src={header.currentUserAvatarUrl}
                          alt={t('common.you', { defaultValue: 'You' })}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                          {(header.currentUserName || t('common.you', { defaultValue: 'You' })).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] font-medium text-foreground max-w-[80px] truncate hidden sm:inline">
                        {header.currentUserName || t('common.you', { defaultValue: 'You' })}
                      </span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[12px] font-bold text-foreground leading-none">{formatTime(elapsed)}</span>
                    </div>

                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm">
                      <Users className="h-3.5 w-3.5 text-success" />
                      <span className="text-[12px] font-bold text-foreground leading-none">
                        {joinedCount}
                        <span className="text-muted-foreground text-[11px] font-normal">
                          {' '}
                          /{totalInvited}
                        </span>
                      </span>
                    </div>

                    {pendingCount > 0 && (
                      <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm">
                        <Clock className="h-3.5 w-3.5 text-warning" />
                        <span className="text-[12px] font-bold text-foreground leading-none">{pendingCount}</span>
                      </div>
                    )}

                    {/* Who joined (avatars) */}
                    <div className="flex -space-x-2" aria-label={t('gamePlay.shell.joined', { defaultValue: 'Joined' })}>
                      {joinedParticipants.slice(0, 4).map((p: GameParticipant, i: number) => (
                        <Avatar
                          key={p.id}
                          className="h-6 w-6 sm:h-7 sm:w-7 ring-2 ring-card"
                          style={{ zIndex: 5 - i }}
                        >
                          {(p as any).avatarUrl && <AvatarImage src={(p as any).avatarUrl} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-[7px] sm:text-[8px] font-bold">
                            {p.avatar}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {joinedCount > 4 && (
                        <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-muted text-[8px] sm:text-[9px] font-bold text-muted-foreground ring-2 ring-card">
                          +{joinedCount - 4}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLink(v => !v)}
                      className="h-8 sm:h-9 text-[11px] sm:text-[12px] gap-1.5 rounded-xl"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t('gamePlay.shell.invite')}</span>
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 sm:h-9 text-[11px] sm:text-[12px] rounded-xl"
                      onClick={header.onEnd}
                    >
                      {t('gamePlay.shell.end')}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider">{t('layout.liveExperience')}</span>
                    <LanguageSelector align="end" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {showGameHeader && showLink && (
            <div className="border-t border-border px-4 sm:px-6 py-3 bg-muted/30 backdrop-blur-sm">
              <div className="relative max-w-[1600px] mx-auto">
                <div className="flex items-center gap-2">
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
                    {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t('gamePlay.shell.copied') : t('gamePlay.shell.copy')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>

        <ReportIssueModal open={isReportOpen} onOpenChange={setIsReportOpen} />
      </div>
    </GameHeaderContext.Provider>
  );
}
