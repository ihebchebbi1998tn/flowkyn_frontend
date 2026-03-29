import {
  ArrowLeft, ArrowRight, Plus, X, Send, Check, Globe, Lock, AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { cn } from '@/lib/utils';
import type { Department } from '@/types';

type Step = 'configure' | 'invite' | 'review';

type TFunctionLike = (key: string, options?: any) => string;

type ActivityLike = {
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  type: 'sync' | 'async';
};

export function LaunchComingSoon({
  activityName,
  t,
  onBack,
}: {
  activityName: string;
  t: TFunctionLike;
  onBack: () => void;
}) {
  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
            {activityName}
          </h1>
          <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5">
            {t('games.comingSoon.title', { defaultValue: 'Coming soon' })}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-[13px] text-muted-foreground">
          {t('games.comingSoonDescription', { defaultValue: 'This activity is coming soon.' })}
        </p>
        <div className="mt-3">
          <Button variant="outline" onClick={onBack}>
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LaunchHeader({
  activity,
  activityName,
  t,
  onBack,
}: {
  activity: ActivityLike;
  activityName: string;
  t: TFunctionLike;
  onBack: () => void;
}) {
  const Icon = activity.icon;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className={cn('flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl shrink-0', activity.bgColor)}>
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', activity.color)} />
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
  );
}

export function LaunchStepIndicator({
  steps,
  step,
  currentStepIndex,
  onChange,
}: {
  steps: { key: Step; label: string; icon: LucideIcon }[];
  step: Step;
  currentStepIndex: number;
  onChange: (step: Step) => void;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1 sm:gap-1.5 flex-1">
          <button
            onClick={() => i <= currentStepIndex && onChange(s.key)}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all flex-1 justify-center',
              step === s.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : i < currentStepIndex
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {i < currentStepIndex ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
          {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

export function LaunchErrorBanner({ error, onClose }: { error: string; onClose: () => void }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg border border-destructive/30 bg-destructive/5">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[12px] sm:text-[13px] font-medium text-destructive">{error}</p>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ConfigureStepSection(props: {
  t: TFunctionLike;
  id: string | undefined;
  activity: ActivityLike;
  eventTitle: string;
  setEventTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  maxParticipants: string;
  setMaxParticipants: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  totalRounds: string;
  setTotalRounds: (v: string) => void;
  visibility: string;
  setVisibility: (v: string) => void;
  scheduleType: 'now' | 'later';
  setScheduleType: (v: 'now' | 'later') => void;
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  endsAt: string;
  setEndsAt: (v: string) => void;
  onNextInvite: () => void;
}) {
  const {
    t, id, activity, eventTitle, setEventTitle, description, setDescription, maxParticipants, setMaxParticipants,
    duration, setDuration, totalRounds, setTotalRounds, visibility, setVisibility, scheduleType, setScheduleType,
    scheduledDate, setScheduledDate, endsAt, setEndsAt, onNextInvite,
  } = props;
  return (
    <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
      <div className="space-y-1">
        <Label className="text-[13px] font-medium">{t('activities.launch.fields.eventTitle', { defaultValue: 'Event Title' })}</Label>
        <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="h-10 text-[13px]" placeholder={t('activities.launch.placeholders.eventTitle', { defaultValue: 'Give your event a name' })} />
      </div>

      <div className="space-y-1">
        <Label className="text-[13px] font-medium">{t('activities.launch.fields.descriptionOptional', { defaultValue: 'Description (optional)' })}</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={1} className="text-[13px]" placeholder={t('activities.launch.placeholders.description', { defaultValue: "What's this event about?" })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        <div className="space-y-1">
          <Label className="text-[13px] font-medium">{t('activities.launch.fields.maxParticipants', { defaultValue: 'Max Participants' })}</Label>
          <Input type="number" min={2} max={100} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} className="h-10 text-[13px]" />
        </div>
        {activity.type === 'sync' && (
          <div className="space-y-1">
            <Label className="text-[13px] font-medium">{t('activities.launch.fields.durationMinutes', { defaultValue: 'Duration (minutes)' })}</Label>
            <Input type="number" min={5} max={120} value={duration} onChange={e => setDuration(e.target.value)} className="h-10 text-[13px]" />
          </div>
        )}
      </div>

      {id === '1' && (
        <div className="space-y-1">
          <Label className="text-[13px] font-medium">{t('gamePlay.twoTruths.howManyRounds')}</Label>
          <Select value={totalRounds} onValueChange={setTotalRounds}>
            <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 29 }, (_, i) => i + 2).map(r => (
                <SelectItem key={r} value={r.toString()}>{r} {t('common.rounds')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">{t('gamePlay.twoTruths.recommendedRounds')}</p>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-[13px] font-medium">{t('activities.launch.fields.visibility', { defaultValue: 'Visibility' })}</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="workspace"><div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> {t('activities.launch.visibility.workspace', { defaultValue: 'Workspace — All members' })}</div></SelectItem>
            <SelectItem value="invite"><div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> {t('activities.launch.visibility.inviteOnly', { defaultValue: 'Invite Only' })}</div></SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-[13px] font-medium">{t('activities.launch.fields.whenToStart', { defaultValue: 'When to start?' })}</Label>
        <div className="flex gap-1.5">
          <Button type="button" variant={scheduleType === 'now' ? 'default' : 'outline'} onClick={() => setScheduleType('now')} className="h-9 text-[12px] flex-1">
            {t('activities.launch.schedule.startNow', { defaultValue: 'Start Now' })}
          </Button>
          <Button type="button" variant={scheduleType === 'later' ? 'default' : 'outline'} onClick={() => setScheduleType('later')} className="h-9 text-[12px] flex-1">
            {t('activities.launch.schedule.scheduleLater', { defaultValue: 'Schedule Later' })}
          </Button>
        </div>
        {scheduleType === 'later' && (
          <DateTimePicker value={scheduledDate} onChange={setScheduledDate} placeholder={t('activities.launch.schedule.pickDateTime', { defaultValue: 'Select a date and time' })} />
        )}
      </div>

      {id === '3' && (
        <div className="space-y-1">
          <Label className="text-[13px] font-medium">{t('activities.launch.fields.endsAt', { defaultValue: 'Ends at' })}</Label>
          <DateTimePicker value={endsAt} onChange={setEndsAt} placeholder={t('activities.launch.schedule.pickEndDateTime', { defaultValue: 'Select an end date and time' })} />
          <p className="text-[10px] text-muted-foreground">{t('activities.launch.fields.endsAtHelp', { defaultValue: 'After this time, new wins and reactions will be disabled (read-only).' })}</p>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button onClick={onNextInvite} className="h-10 px-6 text-[13px] gap-2">
          {t('activities.launch.actions.nextInvite', { defaultValue: 'Next: Invite' })} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function InviteStepSection(props: {
  t: TFunctionLike;
  enableDepartmentInvites: boolean;
  setEnableDepartmentInvites: (fn: (v: boolean) => boolean) => void;
  enableUserInvites: boolean;
  setEnableUserInvites: (fn: (v: boolean) => boolean) => void;
  departments: Department[] | undefined;
  departmentsLoading: boolean;
  selectedDepartmentIds: string[];
  setSelectedDepartmentIds: (fn: (sel: string[]) => string[]) => void;
  emailInput: string;
  setEmailInput: (v: string) => void;
  addEmail: () => void;
  addBulk: (text: string) => void;
  emails: string[];
  setEmails: (emails: string[]) => void;
  removeEmail: (email: string) => void;
  allowNickname: boolean;
  setAllowNickname: (v: boolean) => void;
  onBack: () => void;
  onNextReview: () => void;
}) {
  const {
    t, enableDepartmentInvites, setEnableDepartmentInvites, enableUserInvites, setEnableUserInvites, departments,
    departmentsLoading, selectedDepartmentIds, setSelectedDepartmentIds, emailInput, setEmailInput, addEmail, addBulk,
    emails, setEmails, removeEmail, allowNickname, setAllowNickname, onBack, onNextReview,
  } = props;
  return (
    <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
      <div>
        <h3 className="text-[13px] sm:text-[14px] font-semibold text-foreground mb-0.5">{t('activities.launch.invite.title', { defaultValue: 'Invite your team' })}</h3>
        <p className="text-[11px] sm:text-[12px] text-muted-foreground">{t('activities.launch.invite.subtitle', { defaultValue: "Add email addresses. They'll receive a link to join." })}</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={() => setEnableDepartmentInvites(v => !v)} className={['px-3 py-1.5 rounded-full border text-[11px] transition-colors', enableDepartmentInvites ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'].join(' ')}>
          {t('events.inviteByDepartments', { defaultValue: 'Invite by departments' })}
        </button>
        <button type="button" onClick={() => setEnableUserInvites(v => !v)} className={['px-3 py-1.5 rounded-full border text-[11px] transition-colors', enableUserInvites ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'].join(' ')}>
          {t('events.inviteByUsers', { defaultValue: 'Invite by users' })}
        </button>
      </div>

      {enableDepartmentInvites && (
        <div className="space-y-1">
          <Label className="text-[13px] font-medium">{t('events.selectDepartments', { defaultValue: 'Select departments' })}</Label>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">{t('events.inviteByDepartmentsHelp')}</p>
          <div className="flex flex-wrap gap-2">
            {(departments || []).map((dept) => (
              <label key={dept.id} className="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer">
                <input type="checkbox" checked={selectedDepartmentIds.includes(dept.id)} onChange={(e) => {
                  setSelectedDepartmentIds((sel) => e.target.checked ? [...sel, dept.id] : sel.filter((id) => id !== dept.id));
                }} />
                <span className="text-sm">{dept.name}</span>
              </label>
            ))}
            {departmentsLoading && <span className="text-xs text-muted-foreground">{t('common.loading', { defaultValue: 'Loading...' })}</span>}
          </div>
        </div>
      )}

      {enableUserInvites && (
        <>
          <div className="space-y-1">
            <Label className="text-[13px] font-medium">{t('activities.launch.invite.emailAddresses', { defaultValue: 'Email Addresses' })}</Label>
            <div className="flex gap-1.5">
              <Input value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())} className="h-10 text-[13px] flex-1 min-w-0" placeholder={t('activities.launch.invite.emailPlaceholder', { defaultValue: 'colleague@company.com' })} />
              <Button onClick={addEmail} className="h-10 text-[13px] px-4 shrink-0"><Plus className="h-4 w-4" /></Button>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">{t('activities.launch.invite.addHint', { defaultValue: 'Press Enter or click + to add.' })}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-[13px] font-medium">{t('activities.launch.invite.pasteList', { defaultValue: 'Or paste a list' })}</Label>
            <Textarea placeholder={t('activities.launch.invite.pastePlaceholder', { defaultValue: 'email1@company.com, email2@company.com, ...' })} rows={2} className="text-[13px]" onBlur={e => {
              if (e.target.value) {
                addBulk(e.target.value);
                e.target.value = '';
              }
            }} />
          </div>

          {emails.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium text-foreground">{t('activities.launch.invite.invitedCount', { defaultValue: '{{count}} invited', count: emails.length })}</p>
                <Button variant="ghost" size="sm" className="h-7 text-[11px] text-destructive" onClick={() => setEmails([])}>
                  {t('activities.launch.invite.clearAll', { defaultValue: 'Clear all' })}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
                {emails.map(email => (
                  <Badge key={email} variant="secondary" className="text-[10px] sm:text-[11px] gap-1 pl-2 sm:pl-2 pr-1.5 py-0.5 h-auto">
                    <span className="truncate max-w-[120px] sm:max-w-none">{email}</span>
                    <button onClick={() => removeEmail(email)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Separator />

      <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 gap-2">
        <div className="min-w-0">
          <p className="text-[12px] sm:text-[13px] font-medium text-foreground">{t('activities.launch.invite.allowNickname', { defaultValue: 'Allow nickname join' })}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">{t('activities.launch.invite.noSignup', { defaultValue: 'No signup required' })}</p>
        </div>
        <Switch checked={allowNickname} onCheckedChange={setAllowNickname} />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-1.5 pt-1">
        <Button variant="outline" onClick={onBack} className="h-10 text-[13px] gap-2"><ArrowLeft className="h-4 w-4" /> {t('common.back', { defaultValue: 'Back' })}</Button>
        <Button onClick={onNextReview} disabled={(!enableDepartmentInvites || selectedDepartmentIds.length === 0) && (!enableUserInvites || emails.length === 0)} className="h-10 px-6 text-[13px] gap-2">
          {t('activities.launch.actions.nextReview', { defaultValue: 'Next: Review' })} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ReviewStepSection(props: {
  t: TFunctionLike;
  id: string | undefined;
  activity: ActivityLike;
  eventTitle: string;
  maxParticipants: string;
  scheduleType: 'now' | 'later';
  scheduledDate: string;
  endsAt: string;
  enableDepartmentInvites: boolean;
  selectedDepartmentIds: string[];
  enableUserInvites: boolean;
  emails: string[];
  allowNickname: boolean;
  launching: boolean;
  invitationProgress: { sent: number; total: number };
  onBack: () => void;
  onLaunch: () => void;
}) {
  const {
    t, id, activity, eventTitle, maxParticipants, scheduleType, scheduledDate, endsAt, enableDepartmentInvites,
    selectedDepartmentIds, enableUserInvites, emails, allowNickname, launching, invitationProgress, onBack, onLaunch,
  } = props;
  const Icon = activity.icon;
  return (
    <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
      <div>
        <h3 className="text-[13px] sm:text-[14px] font-semibold text-foreground mb-0.5">{t('activities.launch.review.title', { defaultValue: 'Review & Launch' })}</h3>
        <p className="text-[11px] sm:text-[12px] text-muted-foreground">{t('activities.launch.review.subtitle', { defaultValue: 'Confirm everything looks good.' })}</p>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <div className="grid gap-2 sm:gap-2.5 grid-cols-1 sm:grid-cols-2">
          <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{t('activities.launch.review.activity', { defaultValue: 'Activity' })}</p>
            <div className="flex items-center gap-2">
              <div className={cn('flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg', activity.bgColor)}>
                <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', activity.color)} />
              </div>
              <span className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{activity.name}</span>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{t('activities.launch.review.eventTitle', { defaultValue: 'Event Title' })}</p>
            <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate">{eventTitle || t('activities.launch.untitledEvent', { defaultValue: 'Untitled Event' })}</p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{t('activities.launch.review.participants', { defaultValue: 'Participants' })}</p>
            <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">{t('activities.launch.review.participantsLine', { defaultValue: '{{count}} participants', count: Number(maxParticipants) || 0 })}</p>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{t('activities.launch.review.schedule', { defaultValue: 'Schedule' })}</p>
            <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">{scheduleType === 'now' ? t('activities.launch.review.startingImmediately', { defaultValue: 'Starting immediately' }) : (scheduledDate || t('activities.launch.review.notSet', { defaultValue: 'Not set' }))}</p>
          </div>
          {id === '3' && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{t('activities.launch.review.endsAt', { defaultValue: 'Ends at' })}</p>
              <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">{endsAt || t('activities.launch.review.notSet', { defaultValue: 'Not set' })}</p>
            </div>
          )}
        </div>

        {enableDepartmentInvites && selectedDepartmentIds.length > 0 && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{t('events.selectDepartments', { defaultValue: 'Departments selected' })}</p>
            <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">{t('departmentsSelected', { defaultValue: '{{count}} department(s) selected', count: selectedDepartmentIds.length })}</p>
          </div>
        )}

        {enableUserInvites && emails.length > 0 && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{t('activities.launch.review.invited', { defaultValue: 'Invited ({{count}})', count: emails.length })}</p>
            <div className="flex flex-wrap gap-1">
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

      <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border border-success/20 bg-success/[0.03]">
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-success/10 shrink-0">
          <Send className="h-4 w-4 text-success" />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] sm:text-[13px] font-semibold text-foreground">
            {(enableDepartmentInvites && selectedDepartmentIds.length > 0) || (enableUserInvites && emails.length > 0)
              ? (enableUserInvites && emails.length > 0
                ? t('activities.launch.review.inviteEmailCount', { defaultValue: '{{count}} team members will receive an invite email', count: emails.length })
                : t('activities.launch.review.noInvites', { defaultValue: 'Invites will be sent based on your department selection.' }))
              : t('activities.launch.review.noInvites', { defaultValue: 'No invites — share the link manually' })}
          </p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">
            {allowNickname
              ? t('activities.launch.review.nicknameJoin', { defaultValue: 'They can join with a nickname (no signup required)' })
              : t('activities.launch.review.signupRequired', { defaultValue: 'They need to sign up to join' })}
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-1.5 pt-1">
        <Button variant="outline" onClick={onBack} className="h-10 text-[13px] gap-2"><ArrowLeft className="h-4 w-4" /> {t('common.back', { defaultValue: 'Back' })}</Button>
        <Button onClick={onLaunch} disabled={launching} className="h-10 px-8 text-[13px] gap-2 shadow-sm">
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
  );
}
