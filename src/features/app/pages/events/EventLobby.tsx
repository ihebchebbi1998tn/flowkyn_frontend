/**
 * @fileoverview Event Lobby page — composed from UserProfileSetup + main lobby view.
 *
 * EVERYONE (guests AND authenticated users) must choose a nickname + avatar before joining.
 * The profile is stored per-event in localStorage.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import {
  Users, Clock, Gamepad2, ArrowRight, Copy, CheckCircle,
  Link2, Wifi, Sparkles, Shield, Loader2, AlertCircle, X, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { CountdownOverlay } from '@/features/app/components/game/shared';
import { useEventPublicInfo, useEventParticipants, useJoinEvent, useJoinAsGuest, useAcceptEventInvitation } from '@/hooks/queries/useEventQueries';
import { useAuth } from '@/features/app/context/AuthContext';
import { UserProfileSetup, type ProfileSetupData } from '@/features/app/components/auth/UserProfileSetup';
import logoImg from '@/assets/logo.png';
import { trackEvent, TRACK } from '@/hooks/useTracker';

// ─── Profile helpers ────────────────────────────────────────────────────────

/** Keys for per-event profile in localStorage */
const profileKey = (eventId: string) => `event_profile_${eventId}`;

function getStoredProfile(eventId: string): { displayName: string; avatarUrl: string } | null {
  try {
    const raw = localStorage.getItem(profileKey(eventId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveProfile(eventId: string, data: ProfileSetupData) {
  localStorage.setItem(profileKey(eventId), JSON.stringify(data));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventLobby() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  const { isAuthenticated, user } = useAuth();

  const { data: event, isLoading: eventLoading } = useEventPublicInfo(id || '');
  const { data: participantsData } = useEventParticipants(id || '');
  const joinEvent = useJoinEvent();
  const joinAsGuest = useJoinAsGuest();
  const acceptInvitation = useAcceptEventInvitation();

  // Profile state — loaded from localStorage if already set for this event
  const storedProfile = id ? getStoredProfile(id) : null;
  const [profile, setProfile] = useState<ProfileSetupData | null>(storedProfile);
  const [showProfileForm, setShowProfileForm] = useState(!storedProfile);

  const [guestEmail, setGuestEmail] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [joinError, setJoinError] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);

  const joinLink = `${window.location.origin}/join/${id}`;
  const participants = (participantsData as any)?.data ?? [];

  const copyLinkTimeoutRef = useRef<NodeJS.Timeout>();

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink);
    trackEvent(TRACK.EVENT_LINK_COPIED, { eventId: id });
    setCopied(true);
    if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current);
    copyLinkTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => { if (copyLinkTimeoutRef.current) clearTimeout(copyLinkTimeoutRef.current); };
  }, []);

  /** Called when user completes profile setup */
  const handleProfileComplete = (data: ProfileSetupData) => {
    if (!id) return;
    saveProfile(id, data);
    setProfile(data);
    setShowProfileForm(false);
  };

  /** Join logic — runs AFTER profile is set */
  const handleJoin = async () => {
    if (!id || !profile) return;
    setJoinError('');
    setIsJoining(true);
    try {
      if (isAuthenticated && user) {
        // Authenticated user: accept invitation or join directly
        if (inviteToken) {
          if (!/^[A-Za-z0-9_-]+$/.test(inviteToken)) {
            setJoinError('Invalid invitation token. Please check the link.');
            return;
          }
          await acceptInvitation.mutateAsync({ eventId: id, token: inviteToken });
        } else {
          await joinEvent.mutateAsync(id);
        }
        trackEvent(TRACK.EVENT_JOINED, { eventId: id, viaInvitation: !!inviteToken });
      } else {
        // Guest join
        const result = await joinAsGuest.mutateAsync({
          eventId: id,
          data: {
            name: profile.displayName,
            email: guestEmail || undefined,
            avatar_url: profile.avatarUrl || undefined,
            token: inviteToken || undefined,
          },
        });
        if (result.guest_token) {
          localStorage.setItem(`guest_token_${id}`, result.guest_token);
          localStorage.setItem(`guest_participant_id_${id}`, result.participant_id);
          localStorage.setItem(`guest_name_${id}`, result.guest_name);
        }
        trackEvent(TRACK.EVENT_GUEST_JOINED, { eventId: id, guestName: profile.displayName });
      }
      setHasJoined(true);
    } catch (err: any) {
      const msg = err?.message || 'Failed to join. Please try again.';
      setJoinError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCountdownComplete = useCallback(() => {
    navigate(ROUTES.PLAY(id));
  }, [navigate, id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (eventLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t('events.notFound')}</p>
      </div>
    );
  }

  // ── Profile form gate — everyone must go through this ────────────────────
  if (showProfileForm && !hasJoined) {
    return (
      <ErrorBoundary>
        <UserProfileSetup
          title="Set up your game profile"
          subtitle={`Choose how you'll appear in "${event.title}"`}
          defaultName={isAuthenticated && user ? user.name : ''}
          defaultAvatarUrl={storedProfile?.avatarUrl}
          submitLabel="Continue to Lobby"
          showEmail={!isAuthenticated}
          email={guestEmail}
          onEmailChange={setGuestEmail}
          onSubmit={handleProfileComplete}
        />
      </ErrorBoundary>
    );
  }

  // ── Main lobby ───────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <>
        <CountdownOverlay active={showCountdown} onComplete={handleCountdownComplete} />
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-2xl space-y-6">
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

              <div className="relative p-6 sm:p-8 space-y-6">
                {/* Error Banner */}
                {joinError && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-destructive">{joinError}</p>
                    </div>
                    <button onClick={() => setJoinError('')} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Header */}
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
                        {event.event_mode === 'sync' ? 'LIVE' : 'ASYNC'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{event.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t('events.hostedBy')} <span className="font-medium text-foreground">{event.organization_name}</span>
                    </p>
                  </div>
                </div>

                {/* Your profile preview */}
                {profile && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="You" className="h-10 w-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {profile.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{profile.displayName}</p>
                      <p className="text-[10px] text-muted-foreground">Your game profile</p>
                    </div>
                    <button
                      onClick={() => setShowProfileForm(true)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 shrink-0"
                    >
                      <User className="h-3 w-3" /> Edit
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {(event as any).participant_count} <span className="text-xs font-normal text-muted-foreground">joined</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {(event as any).invited_count ? `${(event as any).invited_count} invited` : `Max ${event.max_participants}`}
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
                      <p className="text-sm font-bold text-foreground">{t('events.connected')}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('common.status')}</p>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('events.waitingToStart')}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {participants.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background/50">
                        <Avatar className="h-7 w-7">
                          {p.avatar && <AvatarImage src={p.avatar} />}
                          <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground">{p.name}</span>
                      </div>
                    ))}
                    {hasJoined && profile && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="You" className="h-7 w-7 rounded-full object-cover" />
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

                {/* Share link */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={joinLink} readOnly className="h-8 text-[12px] bg-background/60 flex-1 border-border/50" />
                  <Button size="sm" variant="outline" onClick={copyLink} className="h-8 text-[11px] gap-1 shrink-0 rounded-lg">
                    {copied ? <CheckCircle className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    {copied ? t('events.copied') : t('events.copy')}
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  {!hasJoined ? (
                    <Button
                      className="flex-1 h-12 gap-2 text-sm"
                      onClick={handleJoin}
                      disabled={isJoining || !profile}
                    >
                      {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isAuthenticated ? t('events.joinEvent') : t('events.guestJoin')}
                    </Button>
                  ) : (
                    <Button className="flex-1 h-12 gap-2 text-sm" onClick={() => setShowCountdown(true)}>
                      <ArrowRight className="h-4 w-4" /> {t('events.enterGame')}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground p-4">
              {event.organization_logo ? (
                <>
                  <span className="text-[11px]">{t('events.poweredBy')}</span>
                  <img src={event.organization_logo} alt={event.organization_name} className="h-5 w-auto max-w-[100px] object-contain grayscale opacity-60" />
                </>
              ) : (
                <>
                  <img src={logoImg} alt="Flowkyn" className="h-5 w-5 object-contain opacity-50" />
                  <span className="text-[11px]">{t('events.poweredBy')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
}
