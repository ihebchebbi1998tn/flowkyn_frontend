import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Users, Globe, Clock, Loader2, Mail, Send, Copy,
  Pause, Square, Trash2, Gamepad2, MoreHorizontal, Pencil, ExternalLink,
  BarChart3, Activity, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useEvent, useEventParticipants, useJoinEvent, useInviteToEvent, usePauseEvent, useStopEvent, useDeleteEvent } from '@/hooks/queries';
import { useQuery } from '@tanstack/react-query';
import { gamesApi } from '@/features/app/api/games';
import { GAME_KEY_TO_CONFIG_ID } from '@/features/app/pages/play/gameTypes';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { copyToClipboard } from '@/utils/clipboard';
import { toast } from 'sonner';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { useApiError } from '@/hooks/useApiError';
import { EventAnalytics } from '@/features/app/components/analytics';
import { DashStat, ChartCard } from '@/features/app/components/dashboard';

const statusColors: Record<string, string> = {
  active: 'bg-success/15 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  paused: 'bg-warning/15 text-warning border-warning/20',
  stopped: 'bg-destructive/15 text-destructive border-destructive/20',
  completed: 'bg-info/15 text-info border-info/20',
};

const statusDot: Record<string, string> = {
  active: 'bg-success',
  draft: 'bg-muted-foreground',
  paused: 'bg-warning',
  stopped: 'bg-destructive',
  completed: 'bg-info',
};

function EventDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function buildJoinLink(eventId: string, _gameId?: string) {
  return `${window.location.origin}/join/${eventId}`;
}

function buildPlayLink(eventId: string, gameId?: string) {
  const base = `${window.location.origin}/play/${eventId}`;
  return gameId ? `${base}?game=${gameId}` : base;
}

function InviteDialog({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const inviteMutation = useInviteToEvent();
  const lang = navigator.language?.split('-')[0] || 'en';
  const { showError } = useApiError();

  const { data: activeSession } = useQuery({
    queryKey: ['active-session', eventId],
    queryFn: () => gamesApi.getActiveSession(eventId),
    enabled: open && !!eventId,
  });
  const gameId = activeSession?.game_type_key
    ? (GAME_KEY_TO_CONFIG_ID[activeSession.game_type_key as keyof typeof GAME_KEY_TO_CONFIG_ID] || activeSession.game_type_key)
    : '1';

  const joinLink = buildJoinLink(eventId, gameId);
  const playLink = buildPlayLink(eventId, gameId);

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteMutation.mutate(
      { eventId, email: email.trim(), lang, gameId },
      {
        onSuccess: () => { setEmail(''); setOpen(false); },
        onError: (err) => showError(err, t('events.inviteFailed')),
      }
    );
  };

  const copyLink = async (url: string, type: 'join' | 'play') => {
    const success = await copyToClipboard(url);
    if (success) {
      trackEvent(TRACK.EVENT_LINK_COPIED, { eventId, type });
      toast.success(t('events.linkCopied'));
    } else {
      toast.error(t('common.copyFailed', { defaultValue: 'Copy failed' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Mail className="h-3.5 w-3.5" /> {t('events.invite')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('events.inviteParticipant')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t('events.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <Button onClick={handleInvite} disabled={!email.trim() || inviteMutation.isPending} className="gap-1.5 shrink-0">
              {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('common.send')}
            </Button>
          </div>
          <div className="space-y-2">
            {[
              { url: joinLink, label: 'Join', type: 'join' as const },
              { url: playLink, label: 'Play', type: 'play' as const },
            ].map(({ url, label, type }) => (
              <div key={type} className="flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                <span className="text-[11px] font-medium text-muted-foreground w-8 shrink-0">{label}</span>
                <Input value={url} readOnly className="h-7 text-[11px] bg-background/60 flex-1" />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => copyLink(url, type)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionConfirmDialog({
  open, onOpenChange, onConfirm, isLoading, title, description, confirmText, isDangerous = false,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; isLoading: boolean;
  title: string; description: string; confirmText: string; isDangerous?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button variant={isDangerous ? 'destructive' : 'default'} size="sm" onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
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

  // Fetch active session to get the game ID for navigation
  const { data: activeSession } = useQuery({
    queryKey: ['active-session', id],
    queryFn: () => gamesApi.getActiveSession(id!),
    enabled: !!id,
  });
  const gameId = activeSession?.game_type_key
    ? (GAME_KEY_TO_CONFIG_ID[activeSession.game_type_key as keyof typeof GAME_KEY_TO_CONFIG_ID] || activeSession.game_type_key)
    : undefined;

  const lobbyUrl = (eventId: string) => {
    const base = ROUTES.EVENT_LOBBY(eventId);
    return gameId ? `${base}?game=${gameId}` : base;
  };

  const [pauseConfirm, setPauseConfirm] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (isLoading) return <EventDetailSkeleton />;
  if (isError) return <ErrorState message={t('events.loadFailed')} description={t('events.loadFailedDescription')} onRetry={() => refetch()} />;
  if (!event) return <ErrorState message={t('events.notFound')} description={t('events.notFoundDescription')} />;

  const isEventActive = event.status === 'active' || event.status === 'draft';

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const columns: Column<any>[] = [
    {
      key: 'name', header: t('organizations.name'), sortable: true,
      render: (p: any) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
              {(p.name || '?')[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{p.name}</span>
        </div>
      ),
    },
    { key: 'type', header: t('events.participants'), sortable: true, hideOnMobile: true },
    {
      key: 'joined_at', header: t('events.joined'), sortable: true, hideOnMobile: true,
      render: (p: any) => <span className="text-sm text-muted-foreground">{formatDate(p.joined_at)}</span>,
    },
  ];

  const isAlreadyParticipant = participants.some(
    (p: any) => p.name?.toLowerCase().includes('tosihaw') || p.is_host
  );

  const handleJoin = () => {
    if (!id) return;
    navigate(lobbyUrl(id));
  };

  const handleJoinAsNew = () => {
    if (!id) return;
    joinEvent.mutate(id, {
      onSuccess: () => {
        trackEvent(TRACK.EVENT_JOINED, { eventId: id });
        toast.success(t('events.joinedSuccessfully', { defaultValue: 'Successfully joined the event!' }));
        navigate(lobbyUrl(id));
      },
      onError: (err) => {
        if ((err as any)?.statusCode === 409 || (err as any)?.code === 'ALREADY_PARTICIPANT') {
          navigate(lobbyUrl(id));
        }
      },
    });
  };
  const handlePause = () => { if (id) pauseEvent.mutate(id, { onSuccess: () => { setPauseConfirm(false); trackEvent(TRACK.EVENT_PAUSED, { eventId: id }); } }); };
  const handleStop = () => { if (id) stopEvent.mutate(id, { onSuccess: () => { setStopConfirm(false); trackEvent(TRACK.EVENT_STOPPED, { eventId: id }); } }); };
  const handleDelete = () => { if (id) deleteEvent.mutate(id, { onSuccess: () => { trackEvent(TRACK.EVENT_DELETED, { eventId: id }); navigate(ROUTES.EVENTS); } }); };

  const gameName = (event as any).game_type_name || (event as any).game_type || t('events.gameTypeUnknown', { defaultValue: '—' });

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5 shrink-0" onClick={() => navigate(ROUTES.EVENTS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-foreground truncate">{event.title}</h1>
              <Badge className={cn('text-[10px] px-2 py-0 border shrink-0 gap-1.5', statusColors[event.status || ''] || statusColors.draft)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', statusDot[event.status || ''] || statusDot.draft)} />
                {t(`events.status.${event.status}`)}
              </Badge>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleJoin} className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            {t('events.openLobby', { defaultValue: 'Open Lobby' })}
          </Button>
          <InviteDialog eventId={id!} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => navigate(ROUTES.EVENT_EDIT(id))}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(lobbyUrl(id!))}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> {t('events.openLobby')}
              </DropdownMenuItem>
              {isEventActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPauseConfirm(true)} disabled={pauseEvent.isPending}>
                    <Pause className="h-3.5 w-3.5 mr-2" /> {t('events.pause')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStopConfirm(true)} disabled={stopEvent.isPending}>
                    <Square className="h-3.5 w-3.5 mr-2" /> {t('events.stop')}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteConfirm(true)} className="text-destructive focus:text-destructive" disabled={deleteEvent.isPending}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> {t('events.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <DashStat
          label={t('events.startTime')}
          value={formatDate(event.start_time)}
          icon={Calendar}
          gradient="primary"
        />
        <DashStat
          label={t('events.endTime')}
          value={formatDate(event.end_time)}
          icon={Clock}
          gradient="info"
        />
        <DashStat
          label={t('events.gameType')}
          value={gameName}
          icon={Gamepad2}
          gradient="warning"
        />
        <DashStat
          label={t('events.participants')}
          value={`${participants.length} / ${event.max_participants}`}
          icon={Users}
          gradient="success"
        />
      </div>

      {/* Tabs: Overview / Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 border border-border/50 rounded-lg p-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" />
            {t('common.overview', { defaultValue: 'Overview' })}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            {t('common.analytics', { defaultValue: 'Analytics' })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-5">
          {/* Event details card */}
          <div className="grid gap-5 lg:grid-cols-3">
            <ChartCard title={t('events.details', { defaultValue: 'Event Details' })} className="lg:col-span-1">
              <div className="space-y-3">
                {[
                  { label: t('common.status', { defaultValue: 'Status' }), value: t(`events.status.${event.status}`) },
                  { label: t('events.eventMode', { defaultValue: 'Mode' }), value: (event as any).event_mode || '—' },
                  { label: t('events.gameType'), value: gameName },
                  { label: t('events.startTime'), value: formatDate(event.start_time) },
                  { label: t('events.endTime'), value: formatDate(event.end_time) },
                  { label: t('events.maxParticipants', { defaultValue: 'Max Participants' }), value: String(event.max_participants) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <span className="font-medium text-foreground text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Participants */}
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden lg:col-span-2">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <h2 className="text-[13px] font-semibold text-foreground">{t('events.participants')}</h2>
                <span className="text-[11px] text-muted-foreground">{participants.length} / {event.max_participants}</span>
              </div>
              <DataTable columns={columns} data={participants} searchable />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <EventAnalytics eventId={id!} />
        </TabsContent>
      </Tabs>

      {/* Confirm dialogs */}
      <ActionConfirmDialog open={pauseConfirm} onOpenChange={setPauseConfirm} onConfirm={handlePause} isLoading={pauseEvent.isPending}
        title={t('events.pauseEvent')} description={t('events.pauseEventDescription')} confirmText={t('events.pause')} />
      <ActionConfirmDialog open={stopConfirm} onOpenChange={setStopConfirm} onConfirm={handleStop} isLoading={stopEvent.isPending}
        title={t('events.stopEvent')} description={t('events.stopEventDescription')} confirmText={t('events.stop')} />
      <ActionConfirmDialog open={deleteConfirm} onOpenChange={setDeleteConfirm} onConfirm={handleDelete} isLoading={deleteEvent.isPending}
        title={t('events.deleteEvent')} description={t('events.deleteEventDescription')} confirmText={t('events.delete')} isDangerous />
    </div>
  );
}
