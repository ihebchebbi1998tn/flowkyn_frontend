import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Gamepad2, ScrollText,
  Settings, LogOut, Shield, ChevronLeft, ChevronRight, Moon, Sun, MessageSquare, Inbox, Star,
  Zap, Package, AlertCircle, TrendingUp, BarChart3, LineChart,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/logo.png';

const NAV_ITEMS = [
  { key: 'dashboard', path: ADMIN_ROUTES.DASHBOARD, icon: LayoutDashboard },
  { key: 'users', path: ADMIN_ROUTES.USERS, icon: Users },
  { key: 'organizations', path: ADMIN_ROUTES.ORGANIZATIONS, icon: Building2 },
  { key: 'games', path: ADMIN_ROUTES.GAMES, icon: Gamepad2 },
  { key: 'contacts', path: ADMIN_ROUTES.CONTACTS, icon: MessageSquare },
  { key: 'earlyAccess', path: ADMIN_ROUTES.EARLY_ACCESS, icon: Inbox },
  { key: 'auditLogs', path: ADMIN_ROUTES.AUDIT_LOGS, icon: ScrollText },
  { key: 'feedbacks', path: ADMIN_ROUTES.FEEDBACKS, icon: Star },
  // TIER 1 Features
  { key: 'featureFlags', path: ADMIN_ROUTES.FEATURE_FLAGS, icon: Zap },
  { key: 'gameContent', path: ADMIN_ROUTES.GAME_CONTENT, icon: Package },
  { key: 'moderationQueue', path: ADMIN_ROUTES.MODERATION_QUEUE, icon: AlertCircle },
  { key: 'userEngagement', path: ADMIN_ROUTES.USER_ENGAGEMENT, icon: TrendingUp },
  { key: 'organizationAnalytics', path: ADMIN_ROUTES.ORG_ANALYTICS, icon: BarChart3 },
  { key: 'analyticsReports', path: ADMIN_ROUTES.ANALYTICS_REPORTS, icon: LineChart },
  { key: 'settings', path: ADMIN_ROUTES.SETTINGS, icon: Settings },
];

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  organizations: 'Organizations',
  games: 'Game Sessions',
  contacts: 'Contact Messages',
  earlyAccess: 'Early Access',
  auditLogs: 'Audit Logs',
  feedbacks: 'Activity Feedback',
  // TIER 1 Features
  featureFlags: 'Feature Flags',
  gameContent: 'Game Content',
  moderationQueue: 'Moderation Queue',
  userEngagement: 'User Engagement',
  organizationAnalytics: 'Org Analytics',
  analyticsReports: 'Reports',
  settings: 'Settings',
};

export function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate(ADMIN_ROUTES.LOGIN);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-border">
          <Link to={ADMIN_ROUTES.DASHBOARD} className="flex items-center gap-2.5 min-w-0">
            <img src={logoImg} alt="Flowkyn" className="h-8 w-8 object-contain shrink-0" />
            {!collapsed && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[14px] font-bold tracking-tight text-foreground">Flowkyn</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  Admin
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ key, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={key}
                to={path}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150 px-3 py-2.5",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                title={
                  collapsed ? (key === 'feedbacks' ? t('activityFeedback.admin.title', { defaultValue: LABELS[key] }) : LABELS[key]) : undefined
                }
              >
                <Icon
                  className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {!collapsed && <span>{key === 'feedbacks' ? t('activityFeedback.admin.title', { defaultValue: LABELS[key] }) : LABELS[key]}</span>}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-2 space-y-1">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {user && (
            <div className={cn("flex items-center gap-2 rounded-lg p-2", collapsed && "flex-col")}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-bold">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-opacity",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "relative z-40 flex h-full w-[260px] flex-col border-r border-border bg-card shadow-elevated transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between h-14 px-3 border-b border-border">
            <Link
              to={ADMIN_ROUTES.DASHBOARD}
              className="flex items-center gap-2.5 min-w-0"
              onClick={() => setMobileOpen(false)}
            >
              <img src={logoImg} alt="Flowkyn" className="h-8 w-8 object-contain shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[14px] font-bold tracking-tight text-foreground">Flowkyn</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  Admin
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ key, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={key}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150 px-3 py-2.5",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon
                    className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  <span>{LABELS[key]}</span>
                </Link>
              );
            })}
          </nav>

          <Separator />

          <div className="p-2 space-y-1">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            {user && (
              <div className="flex items-center gap-2 rounded-lg p-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-bold">
                    {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Shield className="h-4 w-4" />
            </button>
            <span className="text-[13px] font-semibold tracking-tight text-muted-foreground uppercase">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-bold">
                    {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold leading-tight truncate">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight truncate">Administrator</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
