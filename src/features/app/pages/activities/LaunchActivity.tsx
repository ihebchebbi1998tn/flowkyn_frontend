import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Users, MessageSquare, Coffee, Trophy, Lightbulb, Crosshair, Flame, ArrowLeft, Send, Globe, Lock, Plus, X, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { eventsApi } from '@/features/app/api/events';
import { gamesApi } from '@/features/app/api/games';
import { useOrgDepartments } from '@/hooks/queries';
import type { Department } from '@/types';
import { ACTIVITIES as CATALOG_ACTIVITIES } from '@/features/app/data/activities';
import { LaunchComingSoon, LaunchErrorBanner } from './components/LaunchActivitySections';
import { JoinAfterCreateModal } from '@/features/app/components/events/JoinAfterCreateModal';

const ACTIVITIES: Record<string, { name: string; icon: typeof MessageSquare; color: string; bgColor: string; type: 'sync' | 'async'; duration: string }> = {
  '1': { name: 'Two Truths & a Lie', icon: MessageSquare, color: 'text-primary', bgColor: 'bg-primary/10', type: 'sync', duration: '15' },
  '2': { name: 'Coffee Roulette', icon: Coffee, color: 'text-info', bgColor: 'bg-info/10', type: 'sync', duration: '30' },
  '3': { name: 'Wins of the Week', icon: Trophy, color: 'text-warning', bgColor: 'bg-warning/10', type: 'async', duration: '0' },
  '4': { name: 'Strategic Escape Challenge', icon: Target, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'async', duration: '45' },
  '5': { name: 'Team Scavenger Hunt', icon: Crosshair, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'sync', duration: '45' },
  '6': { name: 'Gratitude Circle', icon: Flame, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'async', duration: '0' },
  '7': { name: 'Decision Jam', icon: Users, color: 'text-primary', bgColor: 'bg-primary/10', type: 'sync', duration: '40' },
  '8': { name: 'Culture Snapshot', icon: Lightbulb, color: 'text-warning', bgColor: 'bg-warning/10', type: 'async', duration: '0' },
};

const ACTIVITY_GAME_KEYS: Record<string, string> = {
  '1': 'two-truths',
  '2': 'coffee-roulette',
  '3': 'wins-of-week',
  '4': 'strategic-escape',
  '5': 'scavenger-hunt',
  '6': 'gratitude',
};

export default function LaunchActivity() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const activity = ACTIVITIES[id || '1'];
  const catalogActivity = useMemo(() => CATALOG_ACTIVITIES.find(a => a.id === (id || '1')), [id]);
  const isComingSoon = !!catalogActivity?.comingSoon;
  const activityName = catalogActivity?.i18nKey
    ? t(`${catalogActivity.i18nKey}.name`, { defaultValue: activity?.name })
    : (activity?.name || '');

  const [eventTitle, setEventTitle] = useState(
    activity ? t('activities.launch.defaultEventTitle', { defaultValue: '{{activityName}} — Team Event', activityName }) : ''
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
  const [enableDepartmentInvites, setEnableDepartmentInvites] = useState(true);
  const [enableUserInvites, setEnableUserInvites] = useState(false);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [allowNickname, setAllowNickname] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [invitationProgress, setInvitationProgress] = useState({ sent: 0, total: 0 });
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { user } = useAuth();
  const orgId = user?.organization_id || '';
  const { data: departments, isLoading: departmentsLoading } = useOrgDepartments(orgId);

  useEffect(() => {
    if (!user?.organization_id || !enableUserInvites) return;
    try {
      const raw = localStorage.getItem(`onboarding_team_invites_${user.organization_id}`);
      if (!raw) return;
      const cached: string[] = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0 && emails.length === 0) setEmails(cached);
    } catch { /* best-effort */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organization_id, enableUserInvites]);

  useEffect(() => {
    if (!enableDepartmentInvites || departmentsLoading || !departments?.length) return;
    setSelectedDepartmentIds(prev => prev.length > 0 ? prev : (departments as Department[]).map(d => d.id));
  }, [departments, departmentsLoading, enableDepartmentInvites]);

  if (!activity) { navigate(ROUTES.GAMES); return null; }
  if (isComingSoon) return <LaunchComingSoon activityName={activityName} t={t} onBack={() => navigate(ROUTES.GAMES)} />;

  const Icon = activity.icon;

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
      setEmailInput('');
    }
  };

  const addBulk = (text: string) => {
    const parsed = text.split(/[,;\n\s]+/).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim().toLowerCase()));
    setEmails([...new Set([...emails, ...parsed.map(e => e.trim().toLowerCase())])]);
    setEmailInput('');
  };

  const handleLaunch = async () => {
    setError('');
    setLaunching(true);
    try {
      if (!orgId) throw new Error(t('activities.launch.errors.missingOrgId', { defaultValue: 'Organization ID not found.' }));

      const startTimeIso = scheduleType === 'now' ? new Date().toISOString() : scheduledDate ? new Date(scheduledDate).toISOString() : undefined;
      const endTimeIso = endsAt ? new Date(endsAt).toISOString() : undefined;

      if (endTimeIso && startTimeIso && new Date(endTimeIso).getTime() <= new Date(startTimeIso).getTime()) {
        throw new Error(t('activities.launch.errors.endsAtAfterStart', { defaultValue: 'End must be after start.' }));
      }

      const parsedDuration = Math.max(1, parseInt(duration || '0', 10) || 1);
      const timingConfig = id === '1'
        ? { default_session_duration_minutes: parsedDuration, two_truths_submit_seconds: 30, two_truths_vote_seconds: 20 }
        : id === '2'
          ? { default_session_duration_minutes: parsedDuration, coffee_chat_duration_minutes: parsedDuration }
          : id === '4'
            ? { default_session_duration_minutes: parsedDuration, strategic_discussion_duration_minutes: parsedDuration }
            : { default_session_duration_minutes: parsedDuration };

      const eventData = {
        organization_id: orgId,
        title: eventTitle || t('activities.launch.untitledEvent', { defaultValue: 'Untitled Event' }),
        description,
        event_mode: activity.type,
        visibility: visibility === 'workspace' ? 'public' : 'private',
        max_participants: parseInt(maxParticipants, 10),
        start_time: startTimeIso,
        end_time: endTimeIso,
        allow_guests: allowNickname,
        ...(id ? { game_id: id } : {}),
        ...(enableDepartmentInvites && selectedDepartmentIds.length > 0 ? { invite_department_ids: selectedDepartmentIds } : {}),
        ...(enableUserInvites && emails.length > 0 ? { invites: emails } : {}),
        ...(id === '1' ? { max_rounds: parseInt(totalRounds, 10) } : {}),
        ...timingConfig,
      };

      const createdEvent = await eventsApi.create(eventData);

      if (scheduleType === 'now') {
        try { await eventsApi.update(createdEvent.id, { status: 'active' } as any); } catch {}
        try {
          const gameKey = ACTIVITY_GAME_KEYS[id || '1'];
          if (gameKey) {
            const types = await gamesApi.listTypes();
            const matchingType = types.find(t => t.key === gameKey);
            if (matchingType) await gamesApi.startSession(createdEvent.id, matchingType.id, parseInt(totalRounds, 10));
          }
        } catch {}
      }

      setCreatedEventId(createdEvent.id);
      setShowJoinModal(true);
      setLaunching(false);
    } catch (err: any) {
      console.error('Launch failed:', err);
      setError(err?.response?.data?.message || err?.message || t('activities.launch.errors.generic', { defaultValue: 'Launch failed. Please try again.' }));
      setLaunching(false);
    }
  };

  const canLaunch = (enableDepartmentInvites && selectedDepartmentIds.length > 0) || (enableUserInvites && emails.length > 0);

  return (
    <div className="space-y-3 max-w-[720px]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate(`/activities/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {catalogActivity?.image ? (
          <img src={catalogActivity.image} alt={activityName} className="h-9 w-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', activity.bgColor)}>
            <Icon className={cn('h-4 w-4', activity.color)} />
          </div>
        )}
        <h1 className="text-lg font-semibold text-foreground truncate">{activityName}</h1>
      </div>

      <LaunchErrorBanner error={error} onClose={() => setError('')} />

      {/* Single form card */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
        {/* Event setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs font-medium">{t('activities.launch.fields.eventTitle', { defaultValue: 'Event Title' })}</Label>
            <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs font-medium">{t('activities.launch.fields.descriptionOptional', { defaultValue: 'Description' })} <span className="text-muted-foreground font-normal">({t('auth.optional')})</span></Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={1} className="text-sm min-h-0" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t('activities.launch.fields.maxParticipants', { defaultValue: 'Max Participants' })}</Label>
            <Input type="number" min={2} max={100} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="h-9 text-sm" />
          </div>
          {activity.type === 'sync' && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">{t('activities.launch.fields.durationMinutes', { defaultValue: 'Duration (min)' })}</Label>
              <Input type="number" min={5} max={120} value={duration} onChange={e => setDuration(e.target.value)} className="h-9 text-sm" />
            </div>
          )}
          {id === '1' && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">{t('gamePlay.twoTruths.howManyRounds')}</Label>
              <Select value={totalRounds} onValueChange={setTotalRounds}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 29 }, (_, i) => i + 2).map(r => (
                    <SelectItem key={r} value={r.toString()}>{r} {t('common.rounds')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs font-medium">{t('activities.launch.fields.visibility', { defaultValue: 'Visibility' })}</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="workspace"><div className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> {t('activities.launch.visibility.workspace', { defaultValue: 'All members' })}</div></SelectItem>
                <SelectItem value="invite"><div className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> {t('activities.launch.visibility.inviteOnly', { defaultValue: 'Invite only' })}</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">{t('activities.launch.fields.whenToStart', { defaultValue: 'When' })}</Label>
          <div className="flex gap-1.5">
            <Button type="button" size="sm" variant={scheduleType === 'now' ? 'default' : 'outline'} onClick={() => setScheduleType('now')} className="flex-1 text-xs">
              {t('activities.launch.schedule.startNow', { defaultValue: 'Now' })}
            </Button>
            <Button type="button" size="sm" variant={scheduleType === 'later' ? 'default' : 'outline'} onClick={() => setScheduleType('later')} className="flex-1 text-xs">
              {t('activities.launch.schedule.scheduleLater', { defaultValue: 'Later' })}
            </Button>
          </div>
          {scheduleType === 'later' && (
            <DateTimePicker value={scheduledDate} onChange={setScheduledDate} placeholder={t('activities.launch.schedule.pickDateTime', { defaultValue: 'Pick date & time' })} />
          )}
          {id === '3' && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">{t('activities.launch.fields.endsAt', { defaultValue: 'Ends at' })}</Label>
              <DateTimePicker value={endsAt} onChange={setEndsAt} />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Invites */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setEnableDepartmentInvites(v => !v)} className={cn('px-2.5 py-1 rounded-full border text-[11px] transition-colors', enableDepartmentInvites ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground')}>
              {t('events.inviteByDepartments', { defaultValue: 'By department' })}
            </button>
            <button type="button" onClick={() => setEnableUserInvites(v => !v)} className={cn('px-2.5 py-1 rounded-full border text-[11px] transition-colors', enableUserInvites ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground')}>
              {t('events.inviteByUsers', { defaultValue: 'By email' })}
            </button>
          </div>

          {enableDepartmentInvites && (
            <div className="flex flex-wrap gap-1.5">
              {(departments as Department[] || []).map(dept => (
                <label key={dept.id} className="flex items-center gap-1.5 border rounded px-2 py-1 cursor-pointer text-xs">
                  <input type="checkbox" checked={selectedDepartmentIds.includes(dept.id)} onChange={e => {
                    setSelectedDepartmentIds(sel => e.target.checked ? [...sel, dept.id] : sel.filter(x => x !== dept.id));
                  }} />
                  {dept.name}
                </label>
              ))}
              {departmentsLoading && <span className="text-xs text-muted-foreground">{t('common.loading', { defaultValue: 'Loading...' })}</span>}
            </div>
          )}

          {enableUserInvites && (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <Input value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())} className="h-8 text-xs flex-1" placeholder="colleague@company.com" />
                <Button size="sm" onClick={addEmail} className="h-8 px-2.5"><Plus className="h-3.5 w-3.5" /></Button>
              </div>
              <Textarea placeholder={t('activities.launch.invite.pastePlaceholder', { defaultValue: 'Paste emails...' })} rows={1} className="text-xs min-h-0" onBlur={e => {
                if (e.target.value) { addBulk(e.target.value); e.target.value = ''; }
              }} />
              {emails.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
                  {emails.map(email => (
                    <Badge key={email} variant="secondary" className="text-[10px] gap-0.5 pl-2 pr-1 py-0.5 h-auto">
                      <span className="truncate max-w-[120px]">{email}</span>
                      <button onClick={() => setEmails(emails.filter(e => e !== email))} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nickname toggle */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30">
            <span className="text-xs font-medium">{t('activities.launch.invite.allowNickname', { defaultValue: 'Allow nickname join' })}</span>
            <Switch checked={allowNickname} onCheckedChange={setAllowNickname} />
          </div>
        </div>

        {/* Launch */}
        <Button onClick={handleLaunch} disabled={launching || !canLaunch} className="w-full h-10 gap-2 text-sm font-medium">
          {launching ? (
            <>
              <span className="animate-spin">⏳</span>
              {invitationProgress.total > 0
                ? t('activities.launch.progress.inviting', { defaultValue: 'Inviting... {{sent}}/{{total}}', sent: invitationProgress.sent, total: invitationProgress.total })
                : t('activities.launch.progress.creating', { defaultValue: 'Creating...' })}
            </>
          ) : (
            <><Send className="h-4 w-4" /> {t('activities.launch.actions.launchNow', { defaultValue: 'Launch Now' })}</>
          )}
        </Button>
      </div>

      <JoinAfterCreateModal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          navigate(ROUTES.GAMES);
        }}
        onJoin={() => {
          setShowJoinModal(false);
          if (createdEventId) navigate(ROUTES.EVENT_LOBBY(createdEventId));
        }}
        eventId={createdEventId}
      />
    </div>
  );
}
