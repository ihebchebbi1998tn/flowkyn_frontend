import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutGrid, Gamepad2, Building, BellDot,
  UsersRound, Cog, LogOut, X, LifeBuoy, Sparkles,
  ChevronRight,
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
import logoIcon from '@/assets/logo.png';
import logoFull from '@/assets/flowkyn-logo-full.png';

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
              "group relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-all duration-150",
              collapsed ? "justify-center px-0 py-2" : "px-2.5 py-1.5",
              active
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50",
            )}
            activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
          >
            {/* Neon active indicator */}
            {active && !collapsed && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-sidebar-primary shadow-[0_0_8px_hsl(265_87%_65%_/_0.5)]" />
            )}
            <item.icon className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              active ? "text-sidebar-primary" : "text-sidebar-muted-foreground group-hover:text-sidebar-accent-foreground"
            )} strokeWidth={active ? 2 : 1.5} />
            {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
            {!collapsed && item.badge ? (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar-background">
      {/* Brand header with subtle gradient */}
      <SidebarHeader className={cn("px-3", collapsed ? "py-3" : "py-4")}>
        <div className="flex items-center justify-between">
          <Link to={ROUTES.DASHBOARD} onClick={handleNavClick} className="flex items-center justify-center w-full">
            <div className="relative group/logo">
              {collapsed ? (
                <img
                  src={logoIcon}
                  alt={t('brand.name', { defaultValue: 'Flowkyn' })}
                  className="h-9 w-9 object-contain transition-all duration-300 group-hover/logo:scale-105"
                />
              ) : (
                <img
                  src={logoFull}
                  alt={t('brand.name', { defaultValue: 'Flowkyn' })}
                  className="h-14 w-auto object-contain transition-all duration-300 group-hover/logo:scale-[1.03] drop-shadow-[0_0_12px_hsl(265_87%_65%_/_0.25)]"
                />
              )}
              {/* Ambient glow */}
              <div className="absolute inset-0 rounded-full bg-sidebar-primary/10 blur-2xl -z-10 transition-opacity group-hover/logo:bg-sidebar-primary/20" />
            </div>
          </Link>
          {isMobile && (
            <button
              onClick={() => setOpenMobile(false)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("py-1", collapsed ? "px-1.5" : "px-2")}>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] font-semibold text-sidebar-muted-foreground/60 px-2.5 mb-1">
              {t('nav.menu', { defaultValue: 'Menu' })}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNav.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className={cn("my-2.5", collapsed ? "mx-2" : "mx-2.5")}>
          <div className="h-px bg-sidebar-border" />
        </div>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] font-semibold text-sidebar-muted-foreground/60 px-2.5 mb-1">
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

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        {user && (
          <div className={cn(
            "flex items-center gap-2 w-full rounded-lg p-2 transition-all duration-200",
            "hover:bg-sidebar-accent/60 group/footer",
            collapsed && "flex-col p-1.5"
          )}>
            <div className={cn("flex items-center gap-2.5 flex-1 min-w-0", collapsed && "justify-center")}>
              <div className="relative">
                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-sidebar-primary/20 transition-all group-hover/footer:ring-sidebar-primary/40">
                  <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-[10px] font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar-background" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[12px] font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-sidebar-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sidebar-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('nav.logout')}
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
