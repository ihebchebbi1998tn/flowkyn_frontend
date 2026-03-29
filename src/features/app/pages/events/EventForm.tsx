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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronDown, ChevronUp, Users, Settings2, Radio, Clock, Zap } from 'lucide-react';
import { useCreateEvent, useUpdateEvent, useEvent, useOrgDepartments } from '@/hooks/queries';
import { organizationsApi } from '@/features/app/api/organizations';
import { JoinAfterCreateModal } from '@/features/app/components/events/JoinAfterCreateModal';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import type { Department } from '@/types';
import { GAME_CONFIGS } from '@/features/app/pages/play/gameTypes';
import { cn } from '@/lib/utils';

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
    game_id: '1' as string,
    allow_guests: true,
    allow_chat: true,
    auto_start_games: false,
    max_rounds: 5,
  });

  const [orgIdError, setOrgIdError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [teamMembers, setTeamMembers] = useState<{ email: string; name?: string; status: string }[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [enableDepartmentInvites, setEnableDepartmentInvites] = useState(true);
  const [enableUserInvites, setEnableUserInvites] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const orgId = user?.organization_id || localStorage.getItem('flowkyn_org_id');
    if (orgId && !form.organization_id) {
      setForm(f => ({ ...f, organization_id: orgId }));
    }
    if (!orgId && user?.id && !form.organization_id) {
      console.warn('[EventForm] Organization ID not found.');
    }
  }, [user?.organization_id, user?.id]);

  useEffect(() => {
    if (existingEvent && isEditing) {
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
        game_id: isRecord(existingEvent) && typeof (existingEvent as any).game_id === 'string' ? (existingEvent as any).game_id : '1',
      });
    }
  }, [existingEvent, isEditing]);

  useEffect(() => {
    async function fetchMembers() {
      const orgId = form.organization_id;
      if (!orgId) return;
      try {
        const members = await organizationsApi.listMembers(orgId);
        const invites = await organizationsApi.listInvitations(orgId);
        const all = [
          ...members.filter((m: any) => m && typeof m.email === 'string').map((m: any) => ({ email: String(m.email), name: typeof m.name === 'string' ? m.name : undefined, status: 'active' })),
          ...invites.filter((i: any) => i && typeof i.email === 'string' && i.status !== 'accepted').map((i: any) => ({ email: String(i.email), status: 'invited' })),
        ];
        const uniqueTeamMembers = Array.from(new Map(all.map((item) => [item.email, item])).values());
        setTeamMembers(uniqueTeamMembers);
      } catch {
        setTeamMembers([]);
      }
    }
    fetchMembers();
  }, [form.organization_id, isEditing]);

  const { data: departments, isLoading: departmentsLoading } = useOrgDepartments(form.organization_id);

  useEffect(() => {
    if (isEditing) return;
    if (departmentsLoading) return;
    if (!departments || departments.length === 0) return;
    setSelectedDepartmentIds((prev) => {
      if (!enableDepartmentInvites) return prev;
      return prev.length > 0 ? prev : (departments as Department[]).map((d) => d.id);
    });
  }, [departments, departmentsLoading, isEditing, enableDepartmentInvites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgIdError('');

    if (!form.organization_id) {
      const recoveredOrgId = user?.organization_id || localStorage.getItem('flowkyn_org_id');
      if (recoveredOrgId) {
        setForm(f => ({ ...f, organization_id: recoveredOrgId }));
        return;
      }
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
      if (enableDepartmentInvites && selectedDepartmentIds.length > 0) {
        createPayload.invite_department_ids = selectedDepartmentIds;
      }
      if (enableUserInvites && selectedMembers.length > 0) {
        createPayload.invites = selectedMembers;
      }
      if (form.game_id) {
        createPayload.game_id = form.game_id;
      }
      createEvent.mutate(createPayload as any, {
        onSuccess: (data: any) => {
          setCreatedEventId(String(data.id));
          setShowJoinModal(true);
        },
      });
    }
  };

  const handleJoinEvent = () => {
    if (createdEventId) navigate(`/events/${createdEventId}`);
    setShowJoinModal(false);
  };

  const handleCloseModal = () => {
    navigate('/events');
    setShowJoinModal(false);
  };

  if (isEditing && eventLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const isPending = createEvent.isPending || updateEvent.isPending;

  // Game activity selector cards
  const gameEntries = Object.entries(GAME_CONFIGS).slice(0, 4); // Only show first 4 (active games)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {isEditing ? t('events.editEvent') : t('events.createEvent')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEditing
              ? t('events.editEventSubtitle', { defaultValue: 'Update your event settings' })
              : t('events.createEventSubtitle', { defaultValue: 'Get your team together in under a minute' })}
          </p>
        </div>
      </div>

      {(createEvent.isError || updateEvent.isError) && (
        <AlertBanner type="error" message={isEditing ? t('events.updateFailed') : t('events.createFailed')} />
      )}
      {orgIdError && <AlertBanner type="error" message={orgIdError} onClose={() => setOrgIdError('')} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ─── Activity Picker ─── */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('events.primaryActivity', { defaultValue: 'Activity' })}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {gameEntries.map(([id, cfg]) => {
              const isSelected = form.game_id === id;
              const isSync = cfg.type === 'sync';
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, game_id: id, event_mode: cfg.type }));
                  }}
                  className={cn(
                    'relative flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/30'
                  )}
                >
                  <span className="text-xs font-medium text-foreground leading-tight">
                    {t(cfg.titleKey)}
                  </span>
                  <Badge variant="outline" className={cn(
                    'text-[9px] px-1.5 py-0 h-4 gap-0.5',
                    isSync ? 'text-primary border-primary/20' : 'text-success border-success/20'
                  )}>
                    {isSync ? <><Radio className="h-2 w-2" /> Live</> : <><Clock className="h-2 w-2" /> Async</>}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Core Fields ─── */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">{t('events.eventTitle')}</Label>
              <Input
                placeholder={t('events.eventTitle')}
                className="h-9 text-sm"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">{t('events.description')}</Label>
              <Textarea
                placeholder={t('events.descriptionPlaceholder', { defaultValue: 'Brief description (optional)' })}
                rows={2}
                className="text-sm resize-none"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('events.startTime')}</Label>
              <DateTimePicker
                value={form.start_time}
                onChange={v => setForm(f => ({ ...f, start_time: v }))}
                placeholder={t('events.startTime')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('events.endTime')}</Label>
              <DateTimePicker
                value={form.end_time}
                onChange={v => setForm(f => ({ ...f, end_time: v }))}
                placeholder={t('events.endTime')}
              />
            </div>
          </div>
        </div>

        {/* ─── Invite Section ─── */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('events.inviteTeam', { defaultValue: 'Invite' })}
            </Label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEnableDepartmentInvites(v => !v)}
              className={cn(
                'px-3 py-1.5 rounded-md border text-xs transition-colors',
                enableDepartmentInvites
                  ? 'border-primary text-primary bg-primary/5 font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {t('events.inviteByDepartments', 'By department')}
            </button>
            <button
              type="button"
              onClick={() => setEnableUserInvites(v => !v)}
              className={cn(
                'px-3 py-1.5 rounded-md border text-xs transition-colors',
                enableUserInvites
                  ? 'border-primary text-primary bg-primary/5 font-medium'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {t('events.inviteByUsers', 'By user')}
            </button>
          </div>

          {enableDepartmentInvites && (
            <div className="flex flex-wrap gap-1.5">
              {(departments as Department[] | undefined || []).map((dept) => (
                <label key={dept.id} className={cn(
                  'flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 cursor-pointer text-xs transition-colors',
                  selectedDepartmentIds.includes(dept.id) ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-border'
                )}>
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded"
                    checked={selectedDepartmentIds.includes(dept.id)}
                    onChange={(e) => {
                      setSelectedDepartmentIds((sel) =>
                        e.target.checked ? [...sel, dept.id] : sel.filter((id) => id !== dept.id)
                      );
                    }}
                  />
                  {dept.name}
                </label>
              ))}
              {departmentsLoading && <span className="text-xs text-muted-foreground">{t('common.loading')}</span>}
            </div>
          )}

          {enableUserInvites && (
            <div className="flex flex-wrap gap-1.5">
              {teamMembers.map(member => (
                <label key={member.email} className={cn(
                  'flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 cursor-pointer text-xs transition-colors',
                  selectedMembers.includes(member.email) ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-border text-muted-foreground'
                )}>
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded"
                    checked={selectedMembers.includes(member.email)}
                    onChange={e => {
                      setSelectedMembers(sel =>
                        e.target.checked ? [...sel, member.email] : sel.filter(email => email !== member.email)
                      );
                    }}
                  />
                  {member.name || member.email}
                  {member.status === 'invited' && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1">{t('events.invited')}</Badge>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ─── Advanced Settings (collapsed) ─── */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>{t('events.settings.sectionTitle', { defaultValue: 'Advanced settings' })}</span>
          {showAdvanced ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
        </button>

        {showAdvanced && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('events.visibility')}</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm(f => ({ ...f, visibility: v === 'public' ? 'public' : 'private' }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{t('events.visibilities.public')}</SelectItem>
                    <SelectItem value="private">{t('events.visibilities.private')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('events.maxParticipants')}</Label>
                <Input type="number" min={2} max={500} className="h-9 text-xs"
                  value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('events.settings.maxRoundsLabel')}</Label>
                <Input type="number" min={1} max={20} className="h-9 text-xs"
                  value={form.max_rounds} onChange={e => setForm(f => ({ ...f, max_rounds: Number(e.target.value) || 1 }))} />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              {[
                { key: 'allow_guests', label: t('events.settings.allowGuestsLabel') },
                { key: 'allow_chat', label: t('events.settings.allowChatLabel') },
                { key: 'auto_start_games', label: t('events.settings.autoStartGamesLabel') },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-normal text-muted-foreground">{label}</Label>
                  <Switch
                    checked={form[key as keyof typeof form] as boolean}
                    onCheckedChange={(checked) => setForm(f => ({ ...f, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Submit ─── */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" type="button" className="h-9 text-xs" onClick={() => navigate('/events')}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="h-9 text-xs gap-1.5 min-w-[100px]"
            disabled={
              isPending ||
              (!enableDepartmentInvites && !enableUserInvites) ||
              (enableDepartmentInvites && selectedDepartmentIds.length === 0 && !enableUserInvites) ||
              (enableUserInvites && selectedMembers.length === 0 && !enableDepartmentInvites)
            }
          >
            <Zap className="h-3.5 w-3.5" />
            {isPending ? t('common.loading') : isEditing ? t('common.save') : t('events.createEvent')}
          </Button>
        </div>
      </form>

      <JoinAfterCreateModal
        isOpen={showJoinModal}
        onClose={handleCloseModal}
        onJoin={handleJoinEvent}
        eventId={createdEventId}
      />
    </div>
  );
}
