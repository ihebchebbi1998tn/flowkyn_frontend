import {
  Users, ArrowRight, Copy, CheckCircle,
  Link2, Wifi, Loader2, AlertCircle, X, User, Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo.png';
import { ACTIVITIES } from '@/features/app/data/activities';

type ProfileSetupData = { displayName: string; avatarUrl: string };
type EventLobbyData = Record<string, any>;
type TFunctionLike = (key: string, options?: any) => string;

type Props = {
  event: EventLobbyData;
  showProfileForm: boolean;
  hasJoined: boolean;
  profile: ProfileSetupData | null;
  joinError: string;
  onClearJoinError: () => void;
  onEditProfile: () => void;
  participants: any[];
  shouldShowYouPill: boolean;
  inviteToken: string | null;
  joinLink: string;
  copied: boolean;
  onCopyLink: () => void;
  isJoining: boolean;
  isAuthenticated: boolean;
  onJoin: () => void;
  onJumpToGame: () => void;
  eventsSocketStatus: string;
  eventsSocketConnected: boolean;
  onlineCount: number | null;
  isSyncing: boolean;
  participantId: string | null;
  gameId?: string | null;
  t: TFunctionLike;
};

export function EventLobbyCard({
  event,
  showProfileForm,
  hasJoined,
  profile,
  joinError,
  onClearJoinError,
  onEditProfile,
  participants,
  shouldShowYouPill,
  inviteToken,
  joinLink,
  copied,
  onCopyLink,
  isJoining,
  isAuthenticated,
  onJoin,
  onJumpToGame,
  eventsSocketStatus,
  eventsSocketConnected,
  onlineCount,
  isSyncing,
  participantId,
  gameId,
  t,
}: Props) {
  const isConnected = eventsSocketStatus === 'connected';
  const activityImage = gameId ? ACTIVITIES.find(a => a.id === gameId)?.image : undefined;

  return (
    <div className="w-full max-w-xl space-y-4">
      {/* Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 sm:p-6 space-y-5">
          {/* Error */}
          {joinError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/5 text-[12px] text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{joinError}</span>
              <button onClick={onClearJoinError} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {/* Header: logo + title + inline status */}
          <div className="flex items-center gap-3">
            {activityImage ? (
              <div className="h-10 w-10 rounded-xl border border-border bg-card shrink-0 overflow-hidden">
                <img src={activityImage} alt={event.title} className="h-full w-full object-cover" />
              </div>
            ) : event.organization_logo ? (
              <div className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center shrink-0 overflow-hidden p-1">
                <img src={event.organization_logo} alt={event.organization_name} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground truncate">{event.title}</h1>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{event.organization_name}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.participant_count}/{event.max_participants}
                </span>
                {isConnected && onlineCount !== null && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-success">
                      <Wifi className="h-3 w-3" />
                      {onlineCount}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge className={cn("text-[10px] gap-1 shrink-0",
              event.event_mode === 'sync' ? 'bg-success/15 text-success border-success/25' : 'bg-info/15 text-info border-info/25')}>
              <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {event.event_mode === 'sync' ? t('events.badgeLive') : t('events.badgeAsync')}
            </Badge>
          </div>

          {/* Draft banner — compact */}
          {event.status === 'draft' && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 text-[11px] text-muted-foreground">
              <span className="text-foreground font-medium">{t('events.lifecycle.draftBannerTitle', "Waiting for facilitator to start")}</span>
            </div>
          )}




          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {participants.map((p: any) => {
                const isYou = participantId && p.id === participantId;
                const Wrapper = isYou ? 'button' : 'div';
                return (
                  <Wrapper
                    key={p.id}
                    {...(isYou ? { onClick: onEditProfile, type: 'button', 'aria-label': t('profileSetup.editProfile') } : {})}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-lg border',
                      isYou
                        ? 'border-primary/40 bg-primary/10 hover:bg-primary/15 transition-colors cursor-pointer shadow-sm'
                        : 'border-border bg-background/50'
                    )}
                  >
                    <Avatar className="h-6 w-6">
                      {p.avatar && <AvatarImage src={p.avatar} />}
                      <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-bold">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-medium text-foreground">
                      {p.name}
                      {p.is_host && (
                        <span className="ml-1 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded-full">★</span>
                      )}
                    </span>
                    {isYou && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                        ✎ {t('common.edit')}
                      </span>
                    )}
                  </Wrapper>
                );
              })}
              {shouldShowYouPill && profile && (
                <button
                  type="button"
                  onClick={onEditProfile}
                  aria-label={t('profileSetup.editProfile')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/15 transition-colors shadow-sm"
                >
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                      {profile.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-foreground">{profile.displayName}</span>
                  <span className="ml-1 inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    ✎ {t('common.edit')}
                  </span>
                </button>
              )}
              {participants.length === 0 && (
                <p className="text-[11px] text-muted-foreground">{t('events.emptyParticipants.title', "You're the first one here")}</p>
              )}
              <div className="flex items-center gap-1 px-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Share link — compact */}
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input value={joinLink} readOnly className="h-8 text-[11px] bg-muted/30 flex-1 border-border/50" />
            <Button size="sm" variant="outline" onClick={onCopyLink} className="h-8 text-[11px] gap-1 shrink-0">
              {copied ? <CheckCircle className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              {copied ? t('events.copied') : t('events.copy')}
            </Button>
          </div>

          {/* CTA */}
          {!hasJoined ? (
            <Button className="w-full h-11 gap-2 text-sm font-semibold" onClick={onJoin} disabled={isJoining || !profile}>
              {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isAuthenticated ? t('events.joinEvent') : t('events.guestJoin')}
            </Button>
          ) : (
            <Button className="w-full h-11 gap-2 text-sm font-semibold" onClick={onJumpToGame}>
              <ArrowRight className="h-4 w-4" /> {t('events.returning.jumpIntoGame', t('events.enterGame'))}
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground/60">
        <img src={logoImg} alt="" className="h-4 w-4 object-contain opacity-40" />
        <span className="text-[10px]">{t('events.poweredBy')}</span>
      </div>
    </div>
  );
}
