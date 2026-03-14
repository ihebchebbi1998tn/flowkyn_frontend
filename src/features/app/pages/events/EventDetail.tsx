import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Globe, Clock, Loader2, Mail, Send, Copy, CheckCircle, Pause, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { InfoCard } from '@/components/cards/StatCard';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useEvent, useEventParticipants, useJoinEvent, useInviteToEvent, usePauseEvent, useStopEvent, useDeleteEvent } from '@/hooks/queries';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { copyToClipboard } from '@/utils/clipboard';
import { toast } from 'sonner';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { useApiError } from '@/hooks/useApiError';

const gradientMap = {
  primary: 'from-primary/80 to-primary',
  success: 'from-success/80 to-success',
  warning: 'from-warning/80 to-warning',
  info: 'from-info/80 to-info',
};

function EventDetailSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <Skeleton className="h-1 w-full" />
            <div className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteDialog({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const inviteMutation = useInviteToEvent();
  const lang = navigator.language?.split('-')[0] || 'en';
  const { showError } = useApiError();

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteMutation.mutate(
      { eventId, email: email.trim(), lang },
      {
        onSuccess: () => {
          setEmail('');
          setOpen(false);
        },
        onError: (err) => {
          // Component-level error handler: log + rich toast with code/requestId
          console.error('Invite error:', err);
          showError(err, t('events.inviteFailed'));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-8 sm:h-9 text-caption sm:text-body-sm gap-1.5 rounded-lg">
          <Mail className="h-3.5 w-3.5" /> {t('events.invite')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-section-title">{t('events.inviteParticipant')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t('events.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-body-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <Button onClick={handleInvite} disabled={!email.trim() || inviteMutation.isPending} className="h-10 px-4 gap-1.5">
              {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('common.send')}
            </Button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
            <Input
              value={`${window.location.origin}/join/${eventId}`}
              readOnly
              className="h-8 text-label-xs bg-background/60 flex-1 border-border/50"
            />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-label-xs gap-1 shrink-0 rounded-lg"
              onClick={async () => {
                const success = await copyToClipboard(`${window.location.origin}/join/${eventId}`);
                if (success) {
                  trackEvent(TRACK.EVENT_LINK_COPIED, { eventId });
                  toast.success(t('events.linkCopied'));
                } else {
                  toast.error(t('common.copyFailed', 'Failed to copy link. Please manually copy the URL.'));
                }
              }}
            >
              <Copy className="h-3 w-3" /> {t('events.copy')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isLoading, 
  title, 
  description,
  confirmText,
  isDangerous = false,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onConfirm: () => void; 
  isLoading: boolean; 
  title: string;
  description: string;
  confirmText: string;
  isDangerous?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-section-title">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-body-sm text-muted-foreground">{description}</p>
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" className="h-8 sm:h-9 text-caption" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant={isDangerous ? 'destructive' : 'default'} 
            className="h-8 sm:h-9 text-caption" 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EventDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, isError, refetch } = useEvent(id || '');
  const { data: participantsData } = useEventParticipants(id || '');
  const participants = participantsData?.data || [];
  const joinEvent = useJoinEvent();
  const pauseEvent = usePauseEvent();
  const stopEvent = useStopEvent();
  const deleteEvent = useDeleteEvent();

  // State for confirmation dialogs
  const [pauseConfirm, setPauseConfirm] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (isLoading) return <EventDetailSkeleton />;

  if (isError) {
    return <ErrorState message={t('events.loadFailed')} description={t('events.loadFailedDescription')} onRetry={() => refetch()} />;
  }

  if (!event) {
    return <ErrorState message={t('events.notFound')} description={t('events.notFoundDescription')} />;
  }

  const detailCards = [
    {
      icon: Calendar,
      label: 'events.startTime',
      value: event.start_time
        ? new Date(event.start_time).toLocaleString()
        : '—',
      gradient: 'primary' as const,
    },
    {
      icon: Clock,
      label: 'events.endTime',
      value: event.end_time
        ? new Date(event.end_time).toLocaleString()
        : '—',
      gradient: 'info' as const,
    },
    {
      icon: Globe,
      label: 'events.mode',
      value: event.event_mode === 'sync'
        ? t('events.liveSync')
        : t('events.async'),
      gradient: 'warning' as const,
    },
    {
      icon: Users,
      label: 'events.participants',
      value: `${participants.length} / ${event.max_participants}`,
      gradient: 'success' as const,
    },
  ];

  const columns: Column<any>[] = [
    {
      key: 'name', header: t('organizations.name'), sortable: true,
      render: (p: any) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="h-6 w-6 sm:h-7 sm:w-7"><AvatarFallback className="bg-primary/10 text-primary text-label-xs font-semibold">{(p.name || '?')[0]}</AvatarFallback></Avatar>
          <span className="text-body-sm font-medium truncate">{p.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('events.participants'),
      sortable: true,
      hideOnMobile: true,
    },
    {
      key: 'joined_at',
      header: t('events.joined'),
      sortable: true,
      hideOnMobile: true,
      render: (p: any) => (
        <span className="text-body-sm text-muted-foreground">
          {p.joined_at ? new Date(p.joined_at).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  const handleJoin = () => {
    if (!id) return;
    joinEvent.mutate(id, {
      onSuccess: () => trackEvent(TRACK.EVENT_JOINED, { eventId: id }),
    });
  };

  const handlePause = () => {
    if (!id) return;
    pauseEvent.mutate(id, {
      onSuccess: () => {
        setPauseConfirm(false);
        trackEvent(TRACK.EVENT_PAUSED, { eventId: id });
      },
    });
  };

  const handleStop = () => {
    if (!id) return;
    stopEvent.mutate(id, {
      onSuccess: () => {
        setStopConfirm(false);
        trackEvent(TRACK.EVENT_STOPPED, { eventId: id });
      },
    });
  };

  const handleDelete = () => {
    if (!id) return;
    deleteEvent.mutate(id, {
      onSuccess: () => {
        trackEvent(TRACK.EVENT_DELETED, { eventId: id });
        navigate(ROUTES.EVENTS);
      },
    });
  };

  const isEventActive = event.status === 'active' || event.status === 'draft';

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(ROUTES.EVENTS)} aria-label={t('common.backToEvents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-section-title truncate">{event.title}</h1>
            {event.status && (
              <Badge variant={event.status === 'active' ? 'default' : 'secondary'} className="text-label-xs">
                {t(`events.status.${event.status}`)}
              </Badge>
            )}
          </div>
          <p className="text-body-sm text-muted-foreground">{event.description}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {detailCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow">
            <div className={cn("h-1 w-full bg-gradient-to-r", gradientMap[card.gradient])} />
            <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4">
              <div className={cn("flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm shrink-0", gradientMap[card.gradient])}>
                <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-label-xs text-muted-foreground uppercase tracking-wider font-medium truncate">{t(card.label)}</p>
                <p className="text-body font-semibold text-card-foreground truncate">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          className="h-8 sm:h-9 text-caption sm:text-body-sm gap-1.5"
          onClick={handleJoin}
          disabled={joinEvent.isPending}
        >
          {joinEvent.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {t('events.joinEvent')}
        </Button>
        <InviteDialog eventId={id!} />
        <Button variant="outline" className="h-8 sm:h-9 text-caption sm:text-body-sm" onClick={() => navigate(ROUTES.EVENT_EDIT(id))}>{t('common.edit')}</Button>
        <Button variant="outline" className="h-8 sm:h-9 text-caption sm:text-body-sm" onClick={() => navigate(ROUTES.EVENT_LOBBY(id))}>
          {t('events.openLobby')}
        </Button>
        
        {isEventActive && (
          <>
            <Button variant="outline" className="h-8 sm:h-9 text-caption sm:text-body-sm gap-1.5" onClick={() => setPauseConfirm(true)} disabled={pauseEvent.isPending}>
              <Pause className="h-3.5 w-3.5" /> {t('events.pause')}
            </Button>
            <Button variant="outline" className="h-8 sm:h-9 text-caption sm:text-body-sm gap-1.5" onClick={() => setStopConfirm(true)} disabled={stopEvent.isPending}>
              <Square className="h-3.5 w-3.5" /> {t('events.stop')}
            </Button>
          </>
        )}
        
        <Button variant="destructive" className="h-8 sm:h-9 text-caption sm:text-body-sm gap-1.5" onClick={() => setDeleteConfirm(true)} disabled={deleteEvent.isPending}>
          <Trash2 className="h-3.5 w-3.5" /> {t('events.delete')}
        </Button>
      </div>

      <InfoCard title={t('events.participants')} gradient="primary">
        <DataTable columns={columns} data={participants} searchable />
      </InfoCard>

      <ActionConfirmDialog
        open={pauseConfirm}
        onOpenChange={setPauseConfirm}
        onConfirm={handlePause}
        isLoading={pauseEvent.isPending}
        title={t('events.pauseEvent')}
        description={t('events.pauseEventDescription')}
        confirmText={t('events.pause')}
      />

      <ActionConfirmDialog
        open={stopConfirm}
        onOpenChange={setStopConfirm}
        onConfirm={handleStop}
        isLoading={stopEvent.isPending}
        title={t('events.stopEvent')}
        description={t('events.stopEventDescription')}
        confirmText={t('events.stop')}
      />

      <ActionConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        onConfirm={handleDelete}
        isLoading={deleteEvent.isPending}
        title={t('events.deleteEvent')}
        description={t('events.deleteEventDescription')}
        confirmText={t('events.delete')}
        isDangerous
      />
    </div>
  );
}
