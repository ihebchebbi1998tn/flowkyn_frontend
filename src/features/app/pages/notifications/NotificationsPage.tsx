import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CalendarDays, Gamepad2, Mail, Settings, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/context/NotificationContext';
import { PageShell, PageHeader, EmptyState } from '@/features/app/components/dashboard';
import { NotificationListSkeleton } from '@/components/loading/Skeletons';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, typeof CalendarDays> = { eventReminder: CalendarDays, gameUpdate: Gamepad2, invitation: Mail, system: Settings };

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { notifications, markAsRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read_at) : notifications;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <PageShell className="max-w-3xl">
      <PageHeader title={t('notifications.title')}
        actions={
          <Button variant="outline" size="sm" onClick={markAllRead} className="h-8 text-[12px] gap-1.5">
            <CheckCheck className="h-3.5 w-3.5" /> {t('notifications.markAllRead')}
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="text-[12px] h-7">{t('notifications.readAll')}</TabsTrigger>
          <TabsTrigger value="unread" className="text-[12px] h-7">{t('notifications.unread')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <NotificationListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          message={t('notifications.noNotifications')}
          description={t('notificationsPage.allCaughtUp')}
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map(n => {
            const Icon = typeIcons[n.type] || Settings;
            const isRead = !!n.read_at;
            const title = (n.data as any)?.title || n.type;
            const message = (n.data as any)?.message || '';
            return (
              <div key={n.id}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer',
                  isRead ? 'border-border bg-card hover:bg-muted/30' : 'border-primary/15 bg-primary/[0.03] hover:bg-primary/[0.05]'
                )}
                onClick={() => markAsRead(n.id)}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-medium leading-tight truncate">{title}</p>
                    {!isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px] h-5 border-border">{n.type}</Badge>
                    <span className="text-[11px] text-muted-foreground">{formatTime(n.created_at)} {t('notifications.timeAgo')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
