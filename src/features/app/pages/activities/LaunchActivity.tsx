import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, ArrowRight, Users, Clock, Timer, MessageSquare, Coffee, Trophy,
  Lightbulb, Crosshair, Flame, Mail, Plus, X, Send, CalendarDays, Settings2, Check,
  Globe, Lock, AlertCircle, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { eventsApi } from '@/features/app/api/events';
import { gamesApi } from '@/features/app/api/games';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { ACTIVITIES as CATALOG_ACTIVITIES } from '@/features/app/data/activities';

const ACTIVITIES: Record<string, { name: string; icon: typeof MessageSquare; color: string; bgColor: string; type: 'sync' | 'async'; duration: string }> = {
  '1': { name: 'Two Truths & a Lie', icon: MessageSquare, color: 'text-primary', bgColor: 'bg-primary/10', type: 'sync', duration: '15' },
  '2': { name: 'Coffee Roulette', icon: Coffee, color: 'text-info', bgColor: 'bg-info/10', type: 'sync', duration: '30' },
  '3': { name: 'Wins of the Week', icon: Trophy, color: 'text-warning', bgColor: 'bg-warning/10', type: 'async', duration: '0' },
  '4': { name: 'Strategic Escape Challenge', icon: Target, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'async', duration: '45' },
  '5': { name: 'Team Scavenger Hunt', icon: Crosshair, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'sync', duration: '45' },
  '6': { name: 'Gratitude Circle', icon: Flame, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'async', duration: '0' },
};

// Mapping from activity ID to backend game_types.key
const ACTIVITY_GAME_KEYS: Record<string, string> = {
  '1': 'two-truths',
  '2': 'coffee-roulette',
  '3': 'wins-of-week',
  '4': 'strategic-escape',
  '5': 'scavenger-hunt',
  '6': 'gratitude',
};

type Step = 'configure' | 'invite' | 'review';

export default function LaunchActivity() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const activity = ACTIVITIES[id || '1'];
  const catalogActivity = useMemo(() => CATALOG_ACTIVITIES.find(a => a.id === (id || '1')), [id]);
  const activityName = catalogActivity?.i18nKey
    ? t(`${catalogActivity.i18nKey}.name`, { defaultValue: activity?.name })
    : (activity?.name || '');

  const [step, setStep] = useState<Step>('configure');
  const [eventTitle, setEventTitle] = useState(
    activity
      ? t('activities.launch.defaultEventTitle', {
        defaultValue: '{{activityName}} — Team Event',
        activityName,
      })
      : ''
  );
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [duration, setDuration] = useState(activity?.duration || '15');
  const [visibility, setVisibility] = useState('workspace');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [totalRounds, setTotalRounds] = useState('4');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [allowNickname, setAllowNickname] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [invitationProgress, setInvitationProgress] = useState({ sent: 0, total: 0 });

  const { user } = useAuth();
  
  // Prepopulate invite emails from onboarding (per-organization cache)
  useEffect(() => {
    if (!user?.organization_id) return;
    try {
      const raw = localStorage.getItem(`onboarding_team_invites_${user.organization_id}`);
      if (!raw) return;
      const cached: string[] = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0 && emails.length === 0) {
        setEmails(cached);
      }
    } catch {
      // Best-effort only; ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organization_id]);

  if (!activity) { navigate('/games'); return null; }

  const Icon = activity.icon;

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !emails.includes(trimmed)) {
      const next = [...emails, trimmed];
      console.log('[LaunchActivity] addEmail', { email: trimmed, total: next.length });
      setEmails(next);
      setEmailInput('');
    }
  };

  const addBulk = (text: string) => {
    const parsed = text.split(/[,;\n\s]+/).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim().toLowerCase()));
    const unique = [...new Set([...emails, ...parsed.map(e => e.trim().toLowerCase())])];
    console.log('[LaunchActivity] addBulk', { added: parsed.length, total: unique.length });
    setEmails(unique);
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    console.log('[LaunchActivity] removeEmail', { email });
    setEmails(emails.filter(e => e !== email));
  };

  const handleLaunch = async () => {
    setError('');
    setLaunching(true);
    
    try {
      // Get organization ID from auth context
      const orgId = user?.organization_id;
      if (!orgId) {
        throw new Error(
          t('activities.launch.errors.missingOrgId', {
            defaultValue: 'Organization ID not found. Please complete onboarding first.',
          })
        );
      }

      // Determine visibility value for backend
      const backendVisibility = visibility === 'workspace' ? 'public' : 'private';

      const startTimeIso =
        scheduleType === 'now'
          ? new Date().toISOString()
          : scheduledDate
            ? new Date(scheduledDate).toISOString()
            : undefined;

      const endTimeIso = endsAt ? new Date(endsAt).toISOString() : undefined;

      if (endTimeIso && startTimeIso) {
        const startMs = new Date(startTimeIso).getTime();
        const endMs = new Date(endTimeIso).getTime();
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
          throw new Error(
            t('activities.launch.errors.endsAtAfterStart', {
              defaultValue: 'End date/time must be after the start date/time.',
            })
          );
        }
      }

      // Create event
      const eventData = {
        organization_id: orgId,
        title: eventTitle || t('activities.launch.untitledEvent', { defaultValue: 'Untitled Event' }),
        description,
        event_mode: activity.type, // 'sync' or 'async'
        visibility: backendVisibility,
        max_participants: parseInt(maxParticipants, 10),
        start_time: startTimeIso,
        end_time: endTimeIso,
        allow_guests: allowNickname,
      };

      const createdEvent = await eventsApi.create(eventData);

      // For "start now" flows, immediately activate the event and start a game session
      // for both sync and async activities so that GamePlay can resolve a live session.
      if (scheduleType === 'now') {
        try {
          // Ensure event is marked active so the backend allows starting sessions
          await eventsApi.update(createdEvent.id, { status: 'active' } as any);
        } catch (statusErr) {
          console.warn('[LaunchActivity] Failed to set event status to active:', (statusErr as any)?.message);
        }

        // If this activity is backed by a game type, create a game session now.
        try {
          const gameKey = ACTIVITY_GAME_KEYS[id || '1'];
          if (gameKey) {
            const types = await gamesApi.listTypes();
            const matchingType = types.find(t => t.key === gameKey);
            if (matchingType) {
              await gamesApi.startSession(createdEvent.id, matchingType.id, parseInt(totalRounds, 10));
            }
          }
        } catch (gameErr) {
          // Game session creation failures should not block event creation or navigation.
          console.warn('[LaunchActivity] Failed to create game session:', (gameErr as any)?.message);
        }
      }

      // Send invitations with better error handling
      if (emails.length > 0) {
        setInvitationProgress({ sent: 0, total: emails.length });
        
        // Use Promise.allSettled for better error aggregation
        const invitePromises = emails.map((email, i) =>
          eventsApi.invite(createdEvent.id, email, i18n.language?.substring(0, 2) || 'en')
            .then(() => {
              setInvitationProgress({ sent: i + 1, total: emails.length });
              return { success: true, email };
            })
            .catch((err) => {
              console.error(`Failed to invite ${email}:`, err);
              return { success: false, email };
            })
        );

        const results = await Promise.all(invitePromises);
        const failedEmails = results
          .filter(r => !r.success)
          .map(r => r.email);

        // Show warning for partial failures, but only prevent navigation on ALL failures
        if (failedEmails.length > 0 && failedEmails.length < emails.length) {
          setError(
            t('activities.launch.errors.inviteSomeFailed', {
              defaultValue: 'Some invitations failed ({{emails}}). The event was created successfully.',
              emails: failedEmails.join(', '),
            })
          );
        } else if (failedEmails.length === emails.length) {
          throw new Error(
            t('activities.launch.errors.inviteAllFailed', {
              defaultValue: 'Failed to send invitations. Please try again.',
            })
          );
        }
      }

      // Navigate to lobby first so creator joins, then they can enter play (fixes 404/403/500/409)
      navigate(ROUTES.EVENT_LOBBY(createdEvent.id) + (id ? `?game=${id}` : ''));
    } catch (err: any) {
      console.error('Launch failed:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        t('activities.launch.errors.generic', { defaultValue: 'Failed to launch activity. Please try again.' });
      setError(errorMessage);
      setLaunching(false);
    }
  };

  const steps: { key: Step; label: string; icon: typeof Settings2 }[] = [
    { key: 'configure', label: t('activities.launch.steps.configure', { defaultValue: 'Configure' }), icon: Settings2 },
    { key: 'invite', label: t('activities.launch.steps.invite', { defaultValue: 'Invite Team' }), icon: Mail },
    { key: 'review', label: t('activities.launch.steps.review', { defaultValue: 'Review & Launch' }), icon: Send },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/activities/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={cn("flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl shrink-0", activity.bgColor)}>
            <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", activity.color)} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
              {t('activities.launch.title', { defaultValue: 'Launch {{activityName}}', activityName })}
            </h1>
            <p className="text-[11px] sm:text-[12px] text-muted-foreground">
              {t('activities.launch.subtitle', { defaultValue: 'Set up and invite your team' })}
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5 sm:gap-2 flex-1">
            <button
              onClick={() => i <= currentStepIndex && setStep(s.key)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all flex-1 justify-center",
                step === s.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : i < currentStepIndex
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < currentStepIndex ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <s.icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[12px] sm:text-[13px] font-medium text-destructive">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 to-primary" />

        {/* STEP 1: Configure */}
        {step === 'configure' && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">
                {t('activities.launch.fields.eventTitle', { defaultValue: 'Event Title' })}
              </Label>
              <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)}
                className="h-10 text-[13px]" placeholder={t('activities.launch.placeholders.eventTitle', { defaultValue: 'Give your event a name' })} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">
                {t('activities.launch.fields.descriptionOptional', { defaultValue: 'Description (optional)' })}
              </Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={2} className="text-[13px]" placeholder={t('activities.launch.placeholders.description', { defaultValue: "What's this event about?" })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">
                  {t('activities.launch.fields.maxParticipants', { defaultValue: 'Max Participants' })}
                </Label>
                <Input type="number" min={2} max={100} value={maxParticipants}
                  onChange={e => setMaxParticipants(e.target.value)}
                  className="h-10 text-[13px]" />
              </div>
              {activity.type === 'sync' && (
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium">
                    {t('activities.launch.fields.durationMinutes', { defaultValue: 'Duration (minutes)' })}
                  </Label>
                  <Input type="number" min={5} max={120} value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="h-10 text-[13px]" />
                </div>
              )}
            </div>
            
            {id === '1' && (
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">{t('gamePlay.twoTruths.howManyRounds')}</Label>
                <Select value={totalRounds} onValueChange={setTotalRounds}>
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map(r => (
                      <SelectItem key={r} value={r.toString()}>{r} {t('common.rounds')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">{t('gamePlay.twoTruths.recommendedRounds')}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">
                {t('activities.launch.fields.visibility', { defaultValue: 'Visibility' })}
              </Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" /> {t('activities.launch.visibility.workspace', { defaultValue: 'Workspace — All members' })}
                    </div>
                  </SelectItem>
                  <SelectItem value="invite">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" /> {t('activities.launch.visibility.inviteOnly', { defaultValue: 'Invite Only' })}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-[13px] font-medium">
                {t('activities.launch.fields.whenToStart', { defaultValue: 'When to start?' })}
              </Label>
              <div className="flex gap-2">
                <Button type="button" variant={scheduleType === 'now' ? 'default' : 'outline'}
                  onClick={() => setScheduleType('now')} className="h-9 text-[12px] flex-1">
                  {t('activities.launch.schedule.startNow', { defaultValue: 'Start Now' })}
                </Button>
                <Button type="button" variant={scheduleType === 'later' ? 'default' : 'outline'}
                  onClick={() => setScheduleType('later')} className="h-9 text-[12px] flex-1">
                  {t('activities.launch.schedule.scheduleLater', { defaultValue: 'Schedule Later' })}
                </Button>
              </div>
              {scheduleType === 'later' && (
                <DateTimePicker 
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  placeholder={t('activities.launch.schedule.pickDateTime', { defaultValue: 'Select a date and time' })}
                />
              )}
            </div>

            {/* Wins of the Week: end date/time */}
            {id === '3' && (
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">
                  {t('activities.launch.fields.endsAt', { defaultValue: 'Ends at' })}
                </Label>
                <DateTimePicker
                  value={endsAt}
                  onChange={setEndsAt}
                  placeholder={t('activities.launch.schedule.pickEndDateTime', { defaultValue: 'Select an end date and time' })}
                />
                <p className="text-[10px] text-muted-foreground">
                  {t('activities.launch.fields.endsAtHelp', { defaultValue: 'After this time, new wins and reactions will be disabled (read-only).' })}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep('invite')} className="h-10 px-6 text-[13px] gap-2">
                {t('activities.launch.actions.nextInvite', { defaultValue: 'Next: Invite' })} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Invite Team */}
        {step === 'invite' && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <h3 className="text-[13px] sm:text-[14px] font-semibold text-foreground mb-1">
                {t('activities.launch.invite.title', { defaultValue: 'Invite your team' })}
              </h3>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground">
                {t('activities.launch.invite.subtitle', { defaultValue: "Add email addresses. They'll receive a link to join." })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">
                {t('activities.launch.invite.emailAddresses', { defaultValue: 'Email Addresses' })}
              </Label>
              <div className="flex gap-2">
                <Input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                  className="h-10 text-[13px] flex-1 min-w-0" placeholder={t('activities.launch.invite.emailPlaceholder', { defaultValue: 'colleague@company.com' })} />
                <Button onClick={addEmail} className="h-10 text-[13px] px-4 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                {t('activities.launch.invite.addHint', { defaultValue: 'Press Enter or click + to add.' })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">
                {t('activities.launch.invite.pasteList', { defaultValue: 'Or paste a list' })}
              </Label>
              <Textarea placeholder={t('activities.launch.invite.pastePlaceholder', { defaultValue: 'email1@company.com, email2@company.com, ...' })}
                rows={2} className="text-[13px]"
                onBlur={e => { if (e.target.value) { addBulk(e.target.value); e.target.value = ''; }}} />
            </div>

            {emails.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-foreground">
                    {t('activities.launch.invite.invitedCount', { defaultValue: '{{count}} invited', count: emails.length })}
                  </p>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] text-destructive" onClick={() => setEmails([])}>
                    {t('activities.launch.invite.clearAll', { defaultValue: 'Clear all' })}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                  {emails.map(email => (
                    <Badge key={email} variant="secondary" className="text-[10px] sm:text-[11px] gap-1 pl-2 sm:pl-2.5 pr-1.5 py-1 h-auto">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{email}</span>
                      <button onClick={() => removeEmail(email)} className="ml-0.5 hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 gap-3">
              <div className="min-w-0">
                <p className="text-[12px] sm:text-[13px] font-medium text-foreground">
                  {t('activities.launch.invite.allowNickname', { defaultValue: 'Allow nickname join' })}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                  {t('activities.launch.invite.noSignup', { defaultValue: 'No signup required' })}
                </p>
              </div>
              <Switch checked={allowNickname} onCheckedChange={setAllowNickname} />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('configure')} className="h-10 text-[13px] gap-2">
                <ArrowLeft className="h-4 w-4" /> {t('common.back', { defaultValue: 'Back' })}
              </Button>
              <Button onClick={() => setStep('review')} disabled={emails.length === 0} className="h-10 px-6 text-[13px] gap-2">
                {t('activities.launch.actions.nextReview', { defaultValue: 'Next: Review' })} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Launch */}
        {step === 'review' && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <h3 className="text-[13px] sm:text-[14px] font-semibold text-foreground mb-1">
                {t('activities.launch.review.title', { defaultValue: 'Review & Launch' })}
              </h3>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground">
                {t('activities.launch.review.subtitle', { defaultValue: 'Confirm everything looks good.' })}
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {t('activities.launch.review.activity', { defaultValue: 'Activity' })}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg", activity.bgColor)}>
                      <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", activity.color)} />
                    </div>
                    <span className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{activity.name}</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {t('activities.launch.review.eventTitle', { defaultValue: 'Event Title' })}
                  </p>
                  <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">
                    {eventTitle || t('activities.launch.untitledEvent', { defaultValue: 'Untitled Event' })}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {t('activities.launch.review.participants', { defaultValue: 'Participants' })}
                  </p>
                  <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">
                    {t('activities.launch.review.participantsLine', {
                      defaultValue: '{{count}} participants',
                      count: Number(maxParticipants) || 0,
                    })}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {t('activities.launch.review.schedule', { defaultValue: 'Schedule' })}
                  </p>
                  <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">
                    {scheduleType === 'now'
                      ? t('activities.launch.review.startingImmediately', { defaultValue: 'Starting immediately' })
                      : (scheduledDate || t('activities.launch.review.notSet', { defaultValue: 'Not set' }))}
                  </p>
                </div>
                {id === '3' && (
                  <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      {t('activities.launch.review.endsAt', { defaultValue: 'Ends at' })}
                    </p>
                    <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">
                      {endsAt || t('activities.launch.review.notSet', { defaultValue: 'Not set' })}
                    </p>
                  </div>
                )}
              </div>

              {emails.length > 0 && (
                <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {t('activities.launch.review.invited', { defaultValue: 'Invited ({{count}})', count: emails.length })}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {emails.slice(0, 8).map(email => (
                      <Badge key={email} variant="outline" className="text-[9px] sm:text-[10px]">{email}</Badge>
                    ))}
                    {emails.length > 8 && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                        {t('activities.launch.review.moreCount', { defaultValue: '+{{count}} more', count: emails.length - 8 })}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-success/20 bg-success/[0.03]">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-success/10 shrink-0">
                <Send className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">
                  {emails.length > 0
                    ? t('activities.launch.review.inviteEmailCount', { defaultValue: '{{count}} team members will receive an invite email', count: emails.length })
                    : t('activities.launch.review.noInvites', { defaultValue: 'No invites — share the link manually' })}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                  {allowNickname
                    ? t('activities.launch.review.nicknameJoin', { defaultValue: 'They can join with a nickname (no signup required)' })
                    : t('activities.launch.review.signupRequired', { defaultValue: 'They need to sign up to join' })}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('invite')} className="h-10 text-[13px] gap-2">
                <ArrowLeft className="h-4 w-4" /> {t('common.back', { defaultValue: 'Back' })}
              </Button>
              <Button 
                onClick={handleLaunch} 
                disabled={launching} 
                className="h-10 px-8 text-[13px] gap-2 shadow-sm"
              >
                {launching ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {invitationProgress.total > 0 
                      ? t('activities.launch.progress.inviting', { defaultValue: 'Inviting... {{sent}}/{{total}}', sent: invitationProgress.sent, total: invitationProgress.total })
                      : t('activities.launch.progress.creating', { defaultValue: 'Creating event...' })}
                  </>
                ) : (
                  <><Send className="h-4 w-4" /> {t('activities.launch.actions.launchNow', { defaultValue: 'Launch Now' })}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
