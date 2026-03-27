import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, PanelLeft, Search, Sun, Moon, X, Plus, CheckCheck, User as UserIcon, Gamepad2, Languages, LogOut } from 'lucide-react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useOrgMembers, useUpdateOrg } from '@/hooks/queries/useOrgQueries';
import { useUpdateProfile } from '@/hooks/queries/useUserQueries';
import { LanguageSelector } from '@/components/common';

export function Topbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { resolvedTheme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { mutate: updateProfile } = useUpdateProfile();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: members } = useOrgMembers(user?.organization_id || '');

  const handleLogout = () => { logout(); navigate(ROUTES.LOGIN); };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    if (user) {
      updateProfile({ language: langCode });
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { activities: [], members: [] };
    return {
      activities: ACTIVITIES.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      ),
      members: (members || []).filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      )
    };
  }, [query, members]);

  const hasResults = results.activities.length > 0 || results.members.length > 0;
  const showDropdown = focused && query.trim().length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
        if (!query) setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [query]);

  useEffect(() => {
    if (isExpanded && inputRef.current) inputRef.current.focus();
  }, [isExpanded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsExpanded(true); }
      if (e.key === 'Escape') { setIsExpanded(false); setFocused(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border/60 bg-card/70 backdrop-blur-2xl px-3 sm:px-5">
      <div className="flex items-center gap-1.5">
        {isMobile && (
          <img src={logoImg} alt={t('brand.name', { defaultValue: 'Flowkyn' })} className="h-6 w-6 object-contain mr-0.5" />
        )}
        <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/80 h-8 w-8 rounded-md transition-colors">
          <PanelLeft className="h-4.5 w-4.5" />
        </SidebarTrigger>
      </div>

      <Separator orientation="vertical" className="h-4 hidden md:block" />

      {/* Search */}
      <div ref={wrapperRef} className="hidden md:flex items-center relative">
        {!isExpanded ? (
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md">
            <Search className="h-4 w-4" />
          </Button>
        ) : (
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={t('common.search')}
              className="h-8 pl-9 pr-20 w-[300px] text-[13px] bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/30 rounded-lg placeholder:text-muted-foreground/50"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {query && (
                <button onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
              <div className="pointer-events-none hidden sm:flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </div>
            </div>
          </div>
        )}

        {showDropdown && isExpanded && (
          <div className="absolute top-full left-0 mt-1.5 w-[400px] rounded-lg border border-border/60 bg-popover/95 backdrop-blur-xl shadow-elevated overflow-hidden z-50">
            {hasResults ? (
              <div className="max-h-[400px] overflow-y-auto">
                {results.activities.length > 0 && (
                  <div className="p-1">
                    <div className="px-2.5 py-2 flex items-center gap-1.5">
                      <Gamepad2 className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                        {t('search.sessions', { defaultValue: 'Quick Sessions' })}
                      </p>
                    </div>
                    {results.activities.map(activity => (
                      <button key={activity.id}
                        onClick={() => { navigate(ROUTES.ACTIVITY_DETAIL(activity.id)); setQuery(''); setFocused(false); setIsExpanded(false); }}
                        className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left hover:bg-muted/80 transition-colors rounded-md"
                      >
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-md shrink-0", activity.bgColor)}>
                          <activity.icon className={cn("h-3.5 w-3.5", activity.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{activity.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{activity.category}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 rounded">
                          {activity.type === 'sync' ? t('games.filters.sync') : t('games.filters.async')}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                {results.activities.length > 0 && results.members.length > 0 && <Separator className="my-0.5" />}
                {results.members.length > 0 && (
                  <div className="p-1">
                    <div className="px-2.5 py-2 flex items-center gap-1.5">
                      <UserIcon className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                        {t('search.people', { defaultValue: 'People' })}
                      </p>
                    </div>
                    {results.members.map(member => (
                      <button key={member.id}
                        onClick={() => { navigate(ROUTES.ORGANIZATIONS); setQuery(''); setFocused(false); setIsExpanded(false); }}
                        className="flex items-center gap-2.5 w-full px-2.5 py-2 text-left hover:bg-muted/80 transition-colors rounded-md"
                      >
                        <Avatar className="h-7 w-7">
                          {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{member.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded capitalize">
                          {member.role_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Search className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] text-foreground font-medium">
                  {t('search.noResults', 'No results for "{{query}}"', { query })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('search.tryDifferent', { defaultValue: 'Try searching for people or games.' })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {isMobile && (
        <Button size="sm" onClick={() => navigate(ROUTES.EVENT_NEW)} className="h-8 px-3 text-[12px] gap-1.5 rounded-lg shadow-neon">
          <Plus className="h-3.5 w-3.5" />
          {t('nav.newEvent', 'New Event')}
        </Button>
      )}

      <div className="flex items-center gap-0.5">
        <LanguageSelector align="end" onChange={handleLanguageChange} />

        <Button variant="ghost" size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-8 w-8 relative text-muted-foreground hover:text-foreground rounded-md transition-colors">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground ring-2 ring-card">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[380px] p-0 rounded-lg border-border/60 bg-popover/95 backdrop-blur-xl shadow-elevated" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[13px] font-semibold text-foreground">{t('notifications.title')}</h3>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-[9px] h-4.5 px-1.5 rounded">{unreadCount}</Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground rounded-md">
                  <CheckCheck className="h-3 w-3" /> {t('notifications.markAllRead')}
                </Button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="h-5 w-5 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[11px] text-muted-foreground">{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                <div className="py-0.5">
                  {recentNotifications.map(n => {
                    const isRead = !!n.read_at;
                    const { title, message } = formatNotificationCopy(n, t);
                    return (
                      <button key={n.id}
                        className={cn(
                          'flex items-start gap-2.5 w-full px-4 py-3 text-left transition-colors hover:bg-muted/60',
                          !isRead && 'bg-primary/[0.03]'
                        )}
                        onClick={() => markAsRead(n.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-medium leading-tight truncate">{title}</p>
                            {!isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
                          {message && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{message}</p>}
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
            <div className="border-t border-border px-4 py-2">
              <Button variant="ghost" size="sm" className="w-full h-8 text-[12px] text-primary hover:text-primary hover:bg-primary/5 rounded-md font-medium"
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
              <Button variant="ghost" className="flex items-center gap-2 h-8 px-1.5 hover:bg-muted rounded-md transition-colors">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <span className="text-[13px] font-medium text-foreground max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg" sideOffset={6}>
              <DropdownMenuLabel className="font-normal pb-2">
                <p className="text-[13px] font-medium text-foreground">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)} className="text-[13px] rounded-md cursor-pointer">
                {t('nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-[13px] text-destructive focus:text-destructive rounded-md cursor-pointer">
                <LogOut className="h-3.5 w-3.5 mr-2" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}