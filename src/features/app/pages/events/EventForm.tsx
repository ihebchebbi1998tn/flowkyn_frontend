import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useCreateEvent, useUpdateEvent, useEvent } from '@/hooks/queries';
import { useOrganization } from '@/hooks/queries/useOrgQueries';
import { useAuth } from '@/context/AuthContext';
import { ErrorState } from '@/components/common/ErrorState';
import { usersApi } from '@/features/app/api/users';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetch user's organization ID. The user is always tied to one org via their membership.
 * We use /users/me to get user, then the org list to derive it.
 * For now, we grab the first org the user is associated with.
 */
function useUserOrgId() {
  const { user } = useAuth();
  // The backend GET /organizations doesn't exist as a list for members,
  // but user's org is available via analytics/dashboard (upcomingEvents contain org info)
  // OR we can derive it from /users/me if the backend exposes it.
  // The simplest path: we query the org detail if we know the ID.
  // For MVP, we'll let users enter it or auto-fetch from onboarding.
  return null; // Will be set from the user's context if available
}

export default function EventForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditing = !!editId;

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: existingEvent, isLoading: eventLoading } = useEvent(editId || '');
  const { user } = useAuth();

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

  // Auto-populate org ID from localStorage (set during onboarding)
  useEffect(() => {
    const cachedOrgId = localStorage.getItem('flowkyn_org_id');
    if (cachedOrgId && !form.organization_id) {
      setForm(f => ({ ...f, organization_id: cachedOrgId }));
    }
  }, []);

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
        onSuccess: () => setTimeout(() => navigate(`/events/${editId}`), 500),
      });
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => setTimeout(() => navigate('/events'), 500),
      });
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/events')} aria-label="Back to events">
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
