import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, PanelLeft, Search, Sun, Moon, X, Plus, CheckCheck } from 'lucide-react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { ROUTES } from '@/constants/routes';
import { ACTIVITIES } from '@/features/app/data/activities';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo.png';
import { formatNotificationCopy } from '@/features/app/utils/notificationCopy';

export function Topbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { resolvedTheme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { logout(); navigate(ROUTES.LOGIN); };

  const results = query.trim().length > 0
    ? ACTIVITIES.filter(a =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase()) ||
      a.type.toLowerCase().includes(query.toLowerCase())
    )
    : [];

  const showDropdown = focused && query.trim().length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm px-3 sm:px-4">
      {/* Mobile: Logo + Sidebar trigger */}
      <div className="flex items-center gap-1.5">
        {isMobile && (
          <img src={logoImg} alt="Flowkyn" className="h-6 w-6 object-contain mr-0.5" />
        )}
        <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg transition-colors">
          <PanelLeft className="h-4 w-4" />
        </SidebarTrigger>
      </div>

      <Separator orientation="vertical" className="h-4 hidden md:block" />

      {/* Search — desktop */}
      <div ref={wrapperRef} className="hidden md:block relative flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={t('common.search')}
            className="h-8 pl-9 pr-8 text-body-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring rounded-lg shadow-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setFocused(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border border-border bg-popover shadow-elevated overflow-hidden z-50 animate-fade-in">
            {results.length > 0 ? (
              <>
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-label uppercase text-muted-foreground">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="max-h-[280px] overflow-y-auto py-1">
                  {results.map(activity => (
                    <button
                      key={activity.id}
                      onClick={() => { navigate(ROUTES.ACTIVITY_DETAIL(activity.id)); setQuery(''); setFocused(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors group"
                    >
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", activity.bgColor)}>
                        <activity.icon className={cn("h-4 w-4", activity.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{activity.name}</p>
                        <p className="text-label-xs text-muted-foreground truncate mt-0.5">{activity.description}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-label-xs px-1.5 h-4",
                        activity.type === 'sync' ? 'border-primary/20 text-primary bg-primary/5' : 'border-success/20 text-success bg-success/5')}>
                        {activity.type === 'sync' ? t('games.filters.sync') : t('games.filters.async')}
                      </Badge>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <Search className="h-4 w-4 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-body-sm text-muted-foreground">
                  {t('search.noResults', { query })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Mobile: Quick create */}
      {isMobile && (
        <Button size="sm" onClick={() => navigate(ROUTES.EVENT_NEW)}
          className="h-8 px-3 text-body-sm gap-1.5 rounded-lg">
          <Plus className="h-3.5 w-3.5" />
          {t('nav.newEvent', 'New Event')}
        </Button>
      )}

      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notification Popover — dropdown from top */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-8 w-8 relative text-muted-foreground hover:text-foreground rounded-lg">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-label-xs font-bold text-destructive-foreground ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0 animate-fade-in" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-[13px] font-bold text-foreground">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-[9px] h-4 px-1.5">{unreadCount}</Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground">
                  <CheckCheck className="h-3 w-3" /> {t('notifications.markAllRead')}
                </Button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="h-5 w-5 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-[12px] text-muted-foreground">{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                <div className="py-1">
                  {recentNotifications.map(n => {
                    const isRead = !!n.read_at;
                    const { title, message } = formatNotificationCopy(n, t);
                    return (
                      <button key={n.id}
                        className={cn(
                          'flex items-start gap-3 w-full px-4 py-3 text-left transition-colors',
                          isRead ? 'hover:bg-muted/30' : 'bg-primary/[0.03] hover:bg-primary/[0.05]'
                        )}
                        onClick={() => markAsRead(n.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-medium leading-tight truncate">{title}</p>
                            {!isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
                          {message && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">{message}</p>
                          )}
                          <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                            {formatTime(n.created_at)} {t('notifications.timeAgo')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-border px-4 py-2.5">
              <Button variant="ghost" size="sm" className="w-full h-8 text-[12px] text-primary hover:text-primary"
                onClick={() => navigate(ROUTES.NOTIFICATIONS)}>
                {t('notifications.viewAll')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-4 mx-0.5 hidden sm:block" />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-8 px-1.5 hover:bg-muted rounded-lg">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-label-xs font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-body-sm font-medium hidden md:inline text-foreground">{user.name.split(' ')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 animate-fade-in">
              <DropdownMenuLabel className="font-normal py-2">
                <p className="text-body-sm font-semibold">{user.name}</p>
                <p className="text-label text-muted-foreground mt-0.5">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="text-body-sm">{t('nav.profile')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)} className="text-body-sm">{t('nav.settings')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive text-body-sm">{t('nav.logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}