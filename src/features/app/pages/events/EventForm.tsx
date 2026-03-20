import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useCreateEvent, useUpdateEvent, useEvent, useOrgDepartments } from '@/hooks/queries';
import { organizationsApi } from '@/features/app/api/organizations';
import { JoinAfterCreateModal } from '@/features/app/components/events/JoinAfterCreateModal';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import type { Department } from '@/types';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

export default function EventForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditing = !!editId;

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: existingEvent, isLoading: eventLoading } = useEvent(editId || '');

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_mode: 'sync' as 'sync' | 'async',
    visibility: 'private' as 'public' | 'private',
    max_participants: 20,
    start_time: '',
    end_time: '',
    organization_id: '',
    allow_guests: true,
    allow_chat: true,
    auto_start_games: false,
    max_rounds: 5,
    allow_participant_game_control: true,
  });

  const [orgIdError, setOrgIdError] = useState('');

  const [teamMembers, setTeamMembers] = useState<{ email: string; name?: string; status: string }[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [inviteMode, setInviteMode] = useState<'departments' | 'users'>('departments');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const EVENT_PRESETS = [
    {
      id: 'onboarding',
      label: t('events.presets.onboarding'),
      values: {
        title: t('events.presets.onboardingTitle'),
        description: t('events.presets.onboardingDescription'),
        event_mode: 'sync' as const,
        visibility: 'private' as const,
        max_participants: 25,
      },
    },
    {
      id: 'weekly_wins',
      label: t('events.presets.weeklyWins'),
      values: {
        title: t('events.presets.weeklyWinsTitle'),
        description: t('events.presets.weeklyWinsDescription'),
        event_mode: 'async' as const,
        visibility: 'private' as const,
        max_participants: 50,
      },
    },
    {
      id: 'icebreakers',
      label: t('events.presets.icebreakers'),
      values: {
        title: t('events.presets.icebreakersTitle'),
        description: t('events.presets.icebreakersDescription'),
        event_mode: 'sync' as const,
        visibility: 'public' as const,
        max_participants: 40,
      },
    },
  ] as const;

  const { user } = useAuth();

  // Auto-populate org ID from auth context or localStorage (fallback)
  useEffect(() => {
    const orgId = user?.organization_id || localStorage.getItem('flowkyn_org_id');
    
    if (orgId && !form.organization_id) {
      console.log('[EventForm] Setting org ID from user or localStorage:', orgId);
      setForm(f => ({ ...f, organization_id: orgId }));
    }
    
    // If org ID is still missing but user exists, provide diagnostic info
    if (!orgId && user?.id && !form.organization_id) {
      console.warn('[EventForm] Organization ID not found. User:', {
        userId: user.id,
        userOrgId: user.organization_id,
        localStorageOrgId: localStorage.getItem('flowkyn_org_id'),
      });
    }
  }, [user?.organization_id, user?.id]); // Added user?.id as dependency

  // Populate form when editing
  useEffect(() => {
    if (existingEvent && isEditing) {
      const allowGameControl =
        isRecord(existingEvent) && typeof (existingEvent as any).allow_participant_game_control === 'boolean'
          ? (existingEvent as any).allow_participant_game_control
          : true;
      setForm({
        title: existingEvent.title || '',
        description: existingEvent.description || '',
        event_mode: existingEvent.event_mode || 'sync',
        visibility: existingEvent.visibility || 'private',
        max_participants: existingEvent.max_participants || 20,
        start_time: existingEvent.start_time ? new Date(existingEvent.start_time).toISOString().slice(0, 16) : '',
        end_time: existingEvent.end_time ? new Date(existingEvent.end_time).toISOString().slice(0, 16) : '',
        organization_id: existingEvent.organization_id || '',
        allow_guests: existingEvent.allow_guests ?? true,
        allow_chat: existingEvent.allow_chat ?? true,
        auto_start_games: existingEvent.auto_start_games ?? false,
        max_rounds: existingEvent.max_rounds ?? 5,
        allow_participant_game_control: allowGameControl,
      });
    }
  }, [existingEvent, isEditing]);

  useEffect(() => {
    async function fetchMembers() {
      const orgId = form.organization_id;
      if (!orgId) return;
      try {
        // Fetch active org members
        const members = await organizationsApi.listMembers(orgId);
        // Fetch pending invitations (including onboarding invites)
        const invites = await organizationsApi.listInvitations(orgId);

        const all = [
          ...members
            .filter((m: any) => m && typeof m.email === 'string')
            .map((m: any) => ({ email: String(m.email), name: typeof m.name === 'string' ? m.name : undefined, status: 'active' })),
          ...invites
            // Include all non-accepted invitations so organizers see everyone
            // they have tried to invite, including onboarding invites.
            .filter((i: any) => i && typeof i.email === 'string' && i.status !== 'accepted')
            .map((i: any) => ({ email: String(i.email), status: 'invited' })),
        ];
        // Deduplicate emails
        const uniqueTeamMembers = Array.from(
          new Map(all.map((item) => [item.email, item])).values()
        );
        setTeamMembers(uniqueTeamMembers);

        // Auto-select everyone by default if we are creating a new event
        if (!isEditing && uniqueTeamMembers.length > 0 && selectedMembers.length === 0) {
          setSelectedMembers(uniqueTeamMembers.map(m => m.email));
        }
      } catch {
        // Best-effort helper; failure here shouldn't block event creation
        setTeamMembers([]);
      }
    }
    fetchMembers();
  }, [form.organization_id, isEditing, selectedMembers.length]);

  // Fetch departments for department-based invites
  const { data: departments, isLoading: departmentsLoading } = useOrgDepartments(form.organization_id);

  // When creating a new event, default-select all departments
  useEffect(() => {
    if (isEditing) return;
    if (departmentsLoading) return;
    if (!departments || departments.length === 0) return;
    setSelectedDepartmentIds((prev) => {
      if (inviteMode !== 'departments') return prev;
      return prev.length > 0 ? prev : (departments as Department[]).map((d) => d.id);
    });
  }, [departments, departmentsLoading, isEditing, inviteMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgIdError('');

    if (!form.organization_id) {
      // Diagnostic: Try to recover org ID before failing
      const recoveredOrgId = user?.organization_id || localStorage.getItem('flowkyn_org_id');
      
      if (recoveredOrgId) {
        console.log('[EventForm] Recovered org ID from recovery attempt:', recoveredOrgId);
        setForm(f => ({ ...f, organization_id: recoveredOrgId }));
        // Let next render cycle use the recovered ID
        return;
      }
      
      // Still missing after recovery attempt - this is a real error
      console.error('[EventForm] Organization ID missing even after recovery attempt', {
        userOrgId: user?.organization_id,
        localStorageOrgId: localStorage.getItem('flowkyn_org_id'),
        userId: user?.id,
      });
      
      setOrgIdError(t('auth.errors.orgRequired'));
      return;
    }

    const payload = {
      ...form,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : undefined,
      end_time: form.end_time ? new Date(form.end_time).toISOString() : undefined,
    };

    if (isEditing && editId) {
      const { organization_id, ...updatePayload } = payload;
      updateEvent.mutate({ eventId: editId, data: updatePayload }, {
        onSuccess: () => navigate(`/events/${editId}`),
      });
    } else {
      const createPayload: Record<string, unknown> = { ...payload };

      if (inviteMode === 'departments') {
        createPayload.invite_department_ids = selectedDepartmentIds;
      } else {
        createPayload.invites = selectedMembers;
      }

      createEvent.mutate(
        createPayload,
        { 
          onSuccess: (data: any) => {
            setCreatedEventId(String(data.id));
            setShowJoinModal(true);
          } 
        }
      );
    }
  };

  const handleJoinEvent = () => {
    if (createdEventId) {
      navigate(`/events/${createdEventId}`);
    }
    setShowJoinModal(false);
  };

  const handleCloseModal = () => {
    navigate('/events');
    setShowJoinModal(false);
  };

  if (isEditing && eventLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/events')} aria-label={t('common.backToEvents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">
          {isEditing ? t('events.editEvent') : t('events.createEvent')}
        </h1>
      </div>

      {(createEvent.isError || updateEvent.isError) && (
        <AlertBanner type="error" message={isEditing ? t('events.updateFailed') : t('events.createFailed')} />
      )}
      {orgIdError && <AlertBanner type="error" message={orgIdError} onClose={() => setOrgIdError('')} />}

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary" />
        <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4.5">
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.presets.title')}</Label>
              <div className="flex flex-wrap gap-2">
                {EVENT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className="px-3 py-1.5 rounded-full border border-border text-[11px] hover:border-primary/60 hover:text-primary transition-colors"
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        ...preset.values,
                      }));
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[13px]">{t('events.eventTitle')}</Label>
            <Input placeholder={t('events.eventTitle')} className="h-10 text-[13px]" required
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">{t('events.description')}</Label>
            <Textarea placeholder={t('events.description')} rows={3} className="text-[13px]"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.mode')}</Label>
              <Select
                value={form.event_mode}
                onValueChange={(v) => setForm((f) => ({ ...f, event_mode: v === 'async' ? 'async' : 'sync' }))}
              >
                <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync">{t('events.liveSync')}</SelectItem>
                  <SelectItem value="async">{t('events.async')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.visibility')}</Label>
              <Select
                value={form.visibility}
                onValueChange={(v) => setForm((f) => ({ ...f, visibility: v === 'public' ? 'public' : 'private' }))}
              >
                <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('events.visibilities.public')}</SelectItem>
                  <SelectItem value="private">{t('events.visibilities.private')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px]">{t('events.maxParticipants')}</Label>
            <Input type="number" min={2} max={500} className="h-10 text-[13px]"
              value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: Number(e.target.value) }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.startTime')}</Label>
              <DateTimePicker 
                value={form.start_time} 
                onChange={v => setForm(f => ({ ...f, start_time: v }))} 
                placeholder={t('events.startTime')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.endTime')}</Label>
              <DateTimePicker 
                value={form.end_time} 
                onChange={v => setForm(f => ({ ...f, end_time: v }))} 
                placeholder={t('events.endTime')}
              />
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <div>
              <Label className="text-[13px] font-semibold">
                {t('events.settings.sectionTitle')}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {t('events.settings.sectionDescription')}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-start gap-2 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.allow_guests}
                  onChange={e => setForm(f => ({ ...f, allow_guests: e.target.checked }))}
                />
                <span>
                  <span className="font-medium block">
                    {t('events.settings.allowGuestsLabel')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t('events.settings.allowGuestsHelp')}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.allow_chat}
                  onChange={e => setForm(f => ({ ...f, allow_chat: e.target.checked }))}
                />
                <span>
                  <span className="font-medium block">
                    {t('events.settings.allowChatLabel')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t('events.settings.allowChatHelp')}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.auto_start_games}
                  onChange={e => setForm(f => ({ ...f, auto_start_games: e.target.checked }))}
                />
                <span>
                  <span className="font-medium block">
                    {t('events.settings.autoStartGamesLabel')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t('events.settings.autoStartGamesHelp')}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.allow_participant_game_control}
                  onChange={e => setForm(f => ({ ...f, allow_participant_game_control: e.target.checked }))}
                />
                <span>
                  <span className="font-medium block">
                    {t('events.settings.allowParticipantGameControlLabel')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t('events.settings.allowParticipantGameControlHelp')}
                  </span>
                </span>
              </label>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px]">
                  {t('events.settings.maxRoundsLabel')}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  className="h-9 text-[13px] max-w-[140px]"
                  value={form.max_rounds}
                  onChange={e => setForm(f => ({ ...f, max_rounds: Number(e.target.value) || 1 }))}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    'events.settings.maxRoundsHelp',
                    'Recommended: 3–5 rounds for most teams.'
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setInviteMode('departments')}
                className={[
                  'px-3 py-1.5 rounded-full border text-[11px] transition-colors',
                  inviteMode === 'departments'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary',
                ].join(' ')}
              >
                {t('events.inviteByDepartments', 'Invite by departments')}
              </button>
              <button
                type="button"
                onClick={() => setInviteMode('users')}
                className={[
                  'px-3 py-1.5 rounded-full border text-[11px] transition-colors',
                  inviteMode === 'users'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary',
                ].join(' ')}
              >
                {t('events.inviteByUsers', 'Invite by users')}
              </button>
            </div>

            {inviteMode === 'departments' && (
              <p className="text-[11px] text-muted-foreground">{t('events.inviteByDepartmentsHelp')}</p>
            )}

            {inviteMode === 'users' && (
              <p className="text-[11px] text-muted-foreground">
                {t('events.inviteByUsersHelp', 'Invitations will be sent to the selected team members.')}
              </p>
            )}

            {inviteMode === 'departments' && (
              <>
                <Label className="text-[13px]">{t('events.selectDepartments', { defaultValue: 'Select departments' })}</Label>

                <div className="flex flex-wrap gap-2">
                  {(departments as Department[] | undefined || []).map((dept) => (
                    <label key={dept.id} className="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDepartmentIds.includes(dept.id)}
                        onChange={(e) => {
                          setSelectedDepartmentIds((sel) =>
                            e.target.checked ? [...sel, dept.id] : sel.filter((id) => id !== dept.id)
                          );
                        }}
                      />
                      <span className="text-sm">{dept.name}</span>
                    </label>
                  ))}
                  {departmentsLoading && <span className="text-xs text-muted-foreground">{t('common.loading', { defaultValue: 'Loading...' })}</span>}
                </div>
              </>
            )}

          {inviteMode === 'users' && (
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.selectTeamMembers')}</Label>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map(member => (
                  <label key={member.email} className="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.email)}
                      onChange={e => {
                        setSelectedMembers(sel =>
                          e.target.checked
                            ? [...sel, member.email]
                            : sel.filter(email => email !== member.email)
                        );
                      }}
                    />
                    <span className="text-sm">{member.name || member.email} ({member.status === 'invited' ? t('events.invited') : t('events.active')})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <Button variant="outline" type="button" className="h-10 text-[13px]" onClick={() => navigate('/events')}>{t('common.cancel')}</Button>
            <Button
              type="submit"
              className="h-10 text-[13px]"
              disabled={
                isPending ||
                (inviteMode === 'departments' ? selectedDepartmentIds.length === 0 : selectedMembers.length === 0)
              }
            >
              {isPending ? t('common.loading') : isEditing ? t('common.save') : t('common.create')}
            </Button>
          </div>
          </div>
        </div>
      </form>
      
      <JoinAfterCreateModal 
        isOpen={showJoinModal}
        onClose={handleCloseModal}
        onJoin={handleJoinEvent}
      />
    </div>
  );
}
