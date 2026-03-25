import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutGrid, Gamepad2, Building, TrendingUp, BellDot,
  UsersRound, Cog, LogOut, X, LifeBuoy, Sparkles,
} from 'lucide-react';
import { NavLink } from '@/components/navigation/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import logoImg from '@/assets/logo.png';

export function AppSidebar() {
  const { t } = useTranslation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const mainNav = [
    { title: t('nav.dashboard'), url: ROUTES.DASHBOARD, icon: LayoutGrid, id: 'tour-dashboard' },
    { title: t('nav.games'), url: ROUTES.GAMES, icon: Gamepad2, id: 'tour-games' },
    { title: t('nav.organizations'), url: ROUTES.ORGANIZATIONS, icon: Building, id: 'tour-organizations' },
    { title: t('nav.analytics'), url: ROUTES.ANALYTICS, icon: TrendingUp, id: 'tour-analytics' },
    { title: t('nav.aiIdeaChat', { defaultValue: 'AI Idea Chat' }), url: ROUTES.AI_IDEA_CHAT, icon: Sparkles, id: 'tour-ai-idea-chat' },
  ];

  const manageNav = [
    { title: t('nav.settings'), url: ROUTES.SETTINGS, icon: Cog },
    { title: t('nav.support'), url: ROUTES.SUPPORT_REPORTS, icon: LifeBuoy },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
    if (isMobile) setOpenMobile(false);
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderNavItem = (item: { title: string; url: string; icon: React.ComponentType<any>; badge?: number; id?: string }) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.url} id={item.id}>
        <SidebarMenuButton asChild isActive={active}>
          <NavLink to={item.url} end={item.url === ROUTES.DASHBOARD}
            onClick={handleNavClick}
            className={cn(
              "group flex items-center gap-3 rounded-lg text-body-sm font-medium transition-colors duration-150",
              collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
              active
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent",
            )}
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-colors duration-150",
              active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} strokeWidth={active ? 2 : 1.7} />
            {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
            {!collapsed && item.badge ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-label-xs font-bold text-destructive-foreground">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center justify-between">
          <Link to={ROUTES.DASHBOARD} onClick={handleNavClick} className="flex items-center justify-center w-full py-2">
            <img src={logoImg} alt={t('brand.name', { defaultValue: 'Flowkyn' })} className={cn("object-contain transition-all duration-200", collapsed ? "h-10 w-10" : "h-16 w-16")} />
          </Link>
          {isMobile && (
            <button
              onClick={() => setOpenMobile(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("py-1", collapsed ? "px-1.5" : "px-2")}>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-label-xs uppercase tracking-widest text-muted-foreground/50 px-3 mb-1">
              {t('nav.menu', { defaultValue: 'Menu' })}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className={cn("my-2 h-px bg-sidebar-border/50", collapsed ? "mx-2" : "mx-3")} />

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-label-xs uppercase tracking-widest text-muted-foreground/50 px-3 mb-1">
              {t('nav.manage', { defaultValue: 'Manage' })}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {manageNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border/50">
        {user && (
          <div className={cn("flex items-center gap-2 w-full rounded-lg p-2", collapsed && "flex-col")}>
            <div className={cn("flex items-center gap-3 flex-1 min-w-0", collapsed && "justify-center")}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-label-xs font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-body-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-label-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('nav.logout')}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
