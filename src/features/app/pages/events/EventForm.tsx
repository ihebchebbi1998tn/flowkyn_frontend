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
import { useCreateEvent, useUpdateEvent, useEvent } from '@/hooks/queries';
import { organizationsApi } from '@/features/app/api/organizations';

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
  });

  const [orgIdError, setOrgIdError] = useState('');

  const [teamMembers, setTeamMembers] = useState<{ email: string; name?: string; status: string }[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const EVENT_PRESETS = [
    {
      id: 'onboarding',
      label: t('events.presets.onboarding', 'Team Onboarding'),
      values: {
        title: 'Team Onboarding Mixer',
        description: '30-minute welcome session with light icebreakers and weekly wins.',
        event_mode: 'sync' as const,
        visibility: 'private' as const,
        max_participants: 25,
      },
    },
    {
      id: 'weekly_wins',
      label: t('events.presets.weeklyWins', 'Weekly Wins'),
      values: {
        title: 'Weekly Wins Celebration',
        description: 'Async check-in where everyone shares their wins of the week.',
        event_mode: 'async' as const,
        visibility: 'private' as const,
        max_participants: 50,
      },
    },
    {
      id: 'icebreakers',
      label: t('events.presets.icebreakers', 'Icebreaker Session'),
      values: {
        title: 'Icebreaker Session',
        description: 'Fast-paced icebreakers to help the team connect.',
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
      setForm(f => ({ ...f, organization_id: orgId }));
    }
  }, [user?.organization_id]);

  // Populate form when editing
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
          ...members.map((m: any) => ({ email: m.email, name: m.name, status: 'active' })),
          ...invites
            .filter((i: any) => i.status === 'pending')
            .map((i: any) => ({ email: i.email, status: 'invited' })),
        ];
        // Deduplicate emails
        const uniqueTeamMembers = Array.from(new Map(all.map(item => [item.email, item])).values());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgIdError('');

    if (!form.organization_id) {
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
      createEvent.mutate(
        { ...payload, invites: selectedMembers },
        { onSuccess: () => navigate('/events') }
      );
    }
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
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/events')} aria-label={t('common.backToEvents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">
          {isEditing ? t('events.editEvent', 'Edit Event') : t('events.createEvent')}
        </h1>
      </div>

      {(createEvent.isError || updateEvent.isError) && (
        <AlertBanner type="error" message={isEditing ? t('events.updateFailed') : t('events.createFailed')} />
      )}
      {orgIdError && <AlertBanner type="error" message={orgIdError} onClose={() => setOrgIdError('')} />}

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary" />
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {!isEditing && (
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.presets.title', 'Start from a template')}</Label>
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
              <Select value={form.event_mode} onValueChange={v => setForm(f => ({ ...f, event_mode: v as any }))}>
                <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync">{t('events.liveSync')}</SelectItem>
                  <SelectItem value="async">{t('events.async')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.visibility')}</Label>
              <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v as any }))}>
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
              <Input type="datetime-local" className="h-10 text-[13px]"
                value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('events.endTime')}</Label>
              <Input type="datetime-local" className="h-10 text-[13px]"
                value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <Button variant="outline" type="button" className="h-10 text-[13px]" onClick={() => navigate('/events')}>{t('common.cancel')}</Button>
            <Button type="submit" className="h-10 text-[13px]" disabled={isPending}>
              {isPending ? t('common.loading') : isEditing ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
