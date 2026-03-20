import {
  Users, Clock, Gamepad2, ArrowRight, Copy, CheckCircle,
  Link2, Wifi, Sparkles, Shield, Loader2, AlertCircle, X, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo.png';

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
  t,
}: Props) {
  return (
    <>
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] border px-2 py-1", showProfileForm ? "bg-primary/5 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border/60")}>
            {t('events.steps.profile', '1. Set profile')}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px] border px-2 py-1", !showProfileForm && !hasJoined ? "bg-primary/5 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border/60")}>
            {t('events.steps.join', '2. Join event')}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px] border px-2 py-1", hasJoined ? "bg-primary/5 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border/60")}>
            {t('events.steps.play', '3. Enter game')}
          </Badge>
        </div>

        <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

          <div className="relative p-6 sm:p-8 space-y-6">
            {event.status === 'draft' && (
              <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/40">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-foreground">
                    {t('events.lifecycle.draftBannerTitle', "Your facilitator hasn’t started yet")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('events.lifecycle.draftBannerBody', 'You can still join the lobby and get ready while you wait.')}
                  </p>
                </div>
              </div>
            )}

            {joinError && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-destructive">{joinError}</p>
                </div>
                <button onClick={onClearJoinError} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-start gap-4">
              {event.organization_logo ? (
                <div className="h-14 w-14 rounded-2xl border border-border bg-card flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-sm">
                  <img src={event.organization_logo} alt={event.organization_name} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                  <Gamepad2 className="h-7 w-7 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{event.title}</h1>
                  <Badge className={cn("text-[10px] gap-1 shrink-0",
                    event.event_mode === 'sync' ? 'bg-success/15 text-success border-success/25' : 'bg-info/15 text-info border-info/25')}>
                    <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {event.event_mode === 'sync' ? t('events.badgeLive') : t('events.badgeAsync')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{event.description}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('events.hostedBy')} <span className="font-medium text-foreground">{event.organization_name}</span>
                </p>
                <p className="text-[11px] text-muted-foreground/80 mt-1.5">
                  {event.allow_guests ? t('events.guestsAllowed', 'Guests allowed') : t('events.membersOnly', 'Members only')}
                  {' · '}
                  {t('events.maxParticipantsShort', { count: event.max_participants })}
                  {' · '}
                  {t('events.statusLabel', 'Status')}: <span className="font-medium text-foreground">{event.status}</span>
                </p>
              </div>
            </div>

            {profile && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={t('common.you', { defaultValue: 'You' })} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {profile.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{profile.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{t('events.yourGameProfile')}</p>
                </div>
                <button onClick={onEditProfile} className="text-[11px] text-primary hover:underline flex items-center gap-1 shrink-0">
                  <User className="h-3 w-3" /> {t('common.edit')}
                </button>
              </div>
            )}

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {event.participant_count}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {t('events.joined', { defaultValue: 'joined' })}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {event.invited_count ? t('events.invitedCountFull', { count: event.invited_count }) : t('events.maxParticipantsShort', { count: event.max_participants })}
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center"><Clock className="h-4 w-4 text-warning" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">{event.status}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('common.status')}</p>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center"><Wifi className="h-4 w-4 text-success" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {eventsSocketStatus === 'connected' && (
                      <>
                        {t('events.connected')}
                        {onlineCount !== null && (
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            · {onlineCount} {t('events.online')}
                          </span>
                        )}
                        {isSyncing && (
                          <span className="text-[11px] font-medium text-muted-foreground ml-1">
                            · {t('events.syncing', 'Syncing…')}
                          </span>
                        )}
                      </>
                    )}
                    {eventsSocketStatus === 'reconnecting' && (
                      <span className="text-xs font-medium text-warning">
                        {t('events.reconnecting', 'Reconnecting…')}
                      </span>
                    )}
                    {eventsSocketStatus === 'disconnected' && !eventsSocketConnected && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {t('events.offline', 'Offline')}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('common.status')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('events.waitingToStart')}</h3>
              {participants.length === 0 && (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <p className="text-[12px] font-semibold text-foreground">
                    {t('events.emptyParticipants.title', "You’re the first one here")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('events.emptyParticipants.body', 'Share the link below to invite your team, then come back here to start together.')}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/50">
                    <Avatar className="h-7 w-7">
                      {p.avatar && <AvatarImage src={p.avatar} />}
                      <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">
                      {p.name}
                      {p.is_host && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                          ★ {t('events.host', 'Host')}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {shouldShowYouPill && profile && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={t('common.you', { defaultValue: 'You' })} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                        {profile.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-foreground">{profile.displayName}</span>
                    <Badge className="text-[8px] h-4 px-1.5 bg-primary/15 text-primary border-primary/25">{t('events.you')}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-2 w-2 rounded-full bg-muted-foreground/20 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">{t('events.waitingForOthers')}</span>
                </div>
              </div>
            </div>

            {inviteToken && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/20">
                <Shield className="h-4 w-4 text-success shrink-0" />
                <p className="text-xs text-success">{t('events.validInvitation')}</p>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input value={joinLink} readOnly className="h-8 text-[12px] bg-background/60 flex-1 border-border/50" />
              <Button size="sm" variant="outline" onClick={onCopyLink} className="h-8 text-[11px] gap-1 shrink-0 rounded-lg">
                {copied ? <CheckCircle className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                {copied ? t('events.copied') : t('events.copy')}
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {!hasJoined ? (
                <Button className="flex-1 h-12 gap-2 text-sm" onClick={onJoin} disabled={isJoining || !profile}>
                  {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isAuthenticated ? t('events.joinEvent') : t('events.guestJoin')}
                </Button>
              ) : (
                <div className="flex-1 space-y-2">
                  {participantId && profile && (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                      {t('events.returning.welcomeBack', {
                        defaultValue: 'Welcome back, {{name}} — you can jump into the game.',
                        name: profile.displayName,
                      })}
                    </div>
                  )}
                  <Button className="w-full h-12 gap-2 text-sm" onClick={onJumpToGame}>
                    <ArrowRight className="h-4 w-4" /> {t('events.returning.jumpIntoGame', t('events.enterGame'))}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground p-4">
          {event.organization_logo ? (
            <>
              <span className="text-label-xs">{t('events.poweredBy')}</span>
              <img src={event.organization_logo} alt={event.organization_name} className="h-5 w-auto max-w-[100px] object-contain grayscale opacity-60" />
            </>
          ) : (
            <>
              <img src={logoImg} alt={t('brand.name', { defaultValue: 'Flowkyn' })} className="h-5 w-5 object-contain opacity-50" />
              <span className="text-label-xs">{t('events.poweredBy')}</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
