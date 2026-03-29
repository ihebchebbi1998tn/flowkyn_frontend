/**
 * Admin Audit Logs — displays platform-wide activity logs with rich filtering.
 * Wired to the real backend via adminApi.listAuditLogs().
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, RefreshCw, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { adminApi, type AuditLogEntry } from '@/features/admin/api/admin';
import { PageHeader } from '@/components/common/PageHeader';
import { LogoLoader } from '@/components/loading/LogoLoader';
import { toast } from 'sonner';

// ─── Action Categories & Colors ──────────────────────────────────────────────

const ACTION_CATEGORIES: Record<string, { label: string; actions: string[] }> = {
  auth: {
    label: '🔐 Authentication',
    actions: ['AUTH_LOGIN', 'AUTH_REGISTER', 'AUTH_LOGOUT', 'AUTH_VERIFY_EMAIL', 'AUTH_FORGOT_PASSWORD', 'AUTH_RESET_PASSWORD'],
  },
  user: {
    label: '👤 User',
    actions: ['USER_UPDATE_PROFILE', 'USER_UPLOAD_AVATAR', 'USER_COMPLETE_ONBOARDING'],
  },
  org: {
    label: '🏢 Organization',
    actions: ['ORG_CREATE', 'ORG_UPDATE', 'ORG_INVITE_MEMBER', 'ORG_ACCEPT_INVITATION', 'ORG_REMOVE_MEMBER', 'ORG_UPLOAD_LOGO'],
  },
  event: {
    label: '📅 Event',
    actions: ['EVENT_CREATE', 'EVENT_UPDATE', 'EVENT_DELETE', 'EVENT_JOIN', 'EVENT_LEAVE', 'EVENT_INVITE', 'EVENT_ACCEPT_INVITATION', 'EVENT_GUEST_JOIN', 'EVENT_SEND_MESSAGE', 'EVENT_CREATE_POST', 'EVENT_REACT_POST'],
  },
  game: {
    label: '🎮 Activity',
    actions: ['GAME_START_SESSION', 'GAME_START_ROUND', 'GAME_SUBMIT_ACTION', 'GAME_FINISH_SESSION'],
  },
  admin: {
    label: '🛡️ Admin',
    actions: ['ADMIN_UPDATE_USER', 'ADMIN_SUSPEND_USER', 'ADMIN_UNSUSPEND_USER', 'ADMIN_DELETE_USER', 'ADMIN_DELETE_ORG'],
  },
  contact: {
    label: '📬 Contact',
    actions: ['CONTACT_SUBMIT', 'CONTACT_UPDATE_STATUS', 'CONTACT_DELETE'],
  },
  system: {
    label: '⚙️ System',
    actions: ['FILE_UPLOAD', 'NOTIFICATION_MARK_READ', 'ANALYTICS_TRACK', 'LEADERBOARD_VIEW'],
  },
};

const actionColors: Record<string, string> = {
  // Auth
  AUTH_LOGIN: 'bg-info/10 text-info border-info/20',
  AUTH_REGISTER: 'bg-success/10 text-success border-success/20',
  AUTH_LOGOUT: 'bg-muted text-muted-foreground border-border',
  AUTH_VERIFY_EMAIL: 'bg-success/10 text-success border-success/20',
  AUTH_FORGOT_PASSWORD: 'bg-warning/10 text-warning border-warning/20',
  AUTH_RESET_PASSWORD: 'bg-warning/10 text-warning border-warning/20',
  // User
  USER_UPDATE_PROFILE: 'bg-info/10 text-info border-info/20',
  USER_UPLOAD_AVATAR: 'bg-info/10 text-info border-info/20',
  USER_COMPLETE_ONBOARDING: 'bg-success/10 text-success border-success/20',
  // Org
  ORG_CREATE: 'bg-success/10 text-success border-success/20',
  ORG_UPDATE: 'bg-info/10 text-info border-info/20',
  ORG_INVITE_MEMBER: 'bg-info/10 text-info border-info/20',
  ORG_ACCEPT_INVITATION: 'bg-success/10 text-success border-success/20',
  ORG_REMOVE_MEMBER: 'bg-destructive/10 text-destructive border-destructive/20',
  ORG_UPLOAD_LOGO: 'bg-info/10 text-info border-info/20',
  // Event
  EVENT_CREATE: 'bg-success/10 text-success border-success/20',
  EVENT_UPDATE: 'bg-info/10 text-info border-info/20',
  EVENT_DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
  EVENT_JOIN: 'bg-success/10 text-success border-success/20',
  EVENT_LEAVE: 'bg-warning/10 text-warning border-warning/20',
  EVENT_INVITE: 'bg-info/10 text-info border-info/20',
  EVENT_ACCEPT_INVITATION: 'bg-success/10 text-success border-success/20',
  EVENT_GUEST_JOIN: 'bg-success/10 text-success border-success/20',
  EVENT_SEND_MESSAGE: 'bg-muted text-muted-foreground border-border',
  EVENT_CREATE_POST: 'bg-info/10 text-info border-info/20',
  EVENT_REACT_POST: 'bg-muted text-muted-foreground border-border',
  // Game
  GAME_START_SESSION: 'bg-primary/10 text-primary border-primary/20',
  GAME_START_ROUND: 'bg-primary/10 text-primary border-primary/20',
  GAME_SUBMIT_ACTION: 'bg-muted text-muted-foreground border-border',
  GAME_FINISH_SESSION: 'bg-success/10 text-success border-success/20',
  // Admin
  ADMIN_UPDATE_USER: 'bg-warning/10 text-warning border-warning/20',
  ADMIN_SUSPEND_USER: 'bg-destructive/10 text-destructive border-destructive/20',
  ADMIN_UNSUSPEND_USER: 'bg-success/10 text-success border-success/20',
  ADMIN_DELETE_USER: 'bg-destructive/10 text-destructive border-destructive/20',
  ADMIN_DELETE_ORG: 'bg-destructive/10 text-destructive border-destructive/20',
  // Contact
  CONTACT_SUBMIT: 'bg-info/10 text-info border-info/20',
  CONTACT_UPDATE_STATUS: 'bg-warning/10 text-warning border-warning/20',
  CONTACT_DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
  // System
  FILE_UPLOAD: 'bg-muted text-muted-foreground border-border',
  NOTIFICATION_MARK_READ: 'bg-muted text-muted-foreground border-border',
  ANALYTICS_TRACK: 'bg-muted text-muted-foreground border-border',
  LEADERBOARD_VIEW: 'bg-info/10 text-info border-info/20',
};

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatMetadata(metadata: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(metadata)
    .filter(([, v]) => v !== undefined && v !== null && v !== '***')
    .map(([key, value]) => ({
      key: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
}

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listAuditLogs(page, 50, {
        action: actionFilter || undefined,
      });
      setLogs(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [actionFilter, categoryFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Action', 'Organization', 'Details'].join(','),
      ...filtered.map(log => [
        log.created_at,
        `"${log.user_name || 'System'}"`,
        `"${log.user_email || ''}"`,
        log.action,
        `"${log.organization_name || ''}"`,
        `"${log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ''}"`,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit logs exported');
  };

  // Filter by category, then by search
  let filtered = logs;
  if (categoryFilter) {
    const categoryActions = ACTION_CATEGORIES[categoryFilter]?.actions || [];
    filtered = filtered.filter(log => categoryActions.includes(log.action));
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(log =>
      (log.user_name || '').toLowerCase().includes(s) ||
      (log.user_email || '').toLowerCase().includes(s) ||
      log.action.toLowerCase().includes(s) ||
      (log.organization_name || '').toLowerCase().includes(s) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(s)
    );
  }

  // Stats
  const errorCount = logs.filter(l => l.action.includes('DELETE') || l.action.includes('SUSPEND')).length;
  const authCount = logs.filter(l => l.action.startsWith('AUTH_')).length;
  const mutationCount = logs.filter(l => !l.action.includes('VIEW') && !l.action.includes('TRACK')).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle={`Platform-wide activity logs (${total} total)`} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Total Logs</p>
          <p className="text-2xl font-bold text-foreground">{total.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Auth Events</p>
          <p className="text-2xl font-bold text-info">{authCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Mutations</p>
          <p className="text-2xl font-bold text-warning">{mutationCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Destructive</p>
          <p className="text-2xl font-bold text-destructive">{errorCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs, users, actions..." className="pl-10 h-9" />
        </div>

        {/* Category filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]">
              <Filter className="h-3.5 w-3.5" />
              {categoryFilter ? ACTION_CATEGORIES[categoryFilter]?.label : 'All Categories'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => { setCategoryFilter(null); setActionFilter(null); }} className="text-[13px]">
              All Categories
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(ACTION_CATEGORIES).map(([key, cat]) => (
              <DropdownMenuItem key={key} onClick={() => { setCategoryFilter(key); setActionFilter(null); }} className="text-[13px]">
                {cat.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Action filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]">
              {actionFilter ? formatAction(actionFilter) : 'All Actions'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto w-56">
            <DropdownMenuItem onClick={() => setActionFilter(null)} className="text-[13px]">All Actions</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(ACTION_CATEGORIES).map(([key, cat]) => (
              <div key={key}>
                <DropdownMenuLabel className="text-[11px] text-muted-foreground">{cat.label}</DropdownMenuLabel>
                {cat.actions.map(a => (
                  <DropdownMenuItem key={a} onClick={() => setActionFilter(a)} className="text-[12px] pl-6">
                    {formatAction(a)}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Active filters */}
      {(categoryFilter || actionFilter) && (
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-muted-foreground">Active filters:</span>
          {categoryFilter && (
            <Badge variant="secondary" className="cursor-pointer text-[11px]" onClick={() => setCategoryFilter(null)}>
              {ACTION_CATEGORIES[categoryFilter]?.label} ×
            </Badge>
          )}
          {actionFilter && (
            <Badge variant="secondary" className="cursor-pointer text-[11px]" onClick={() => setActionFilter(null)}>
              {formatAction(actionFilter)} ×
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-8 px-2 py-3" />
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Timestamp</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">User</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">Action</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden md:table-cell">Organization</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground hidden lg:table-cell">Summary</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="py-20 flex justify-center"><LogoLoader size="md" /></div></td></tr>
              ) : (
                filtered.map(log => {
                  const isExpanded = expandedId === log.id;
                  const metaItems = log.metadata ? formatMetadata(log.metadata) : [];
                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/10' : ''}`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-2 py-3 text-muted-foreground">
                          {metaItems.length > 0 && (
                            isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <div>
                            <p>{new Date(log.created_at).toLocaleDateString()}</p>
                            <p className="text-[11px]">{new Date(log.created_at).toLocaleTimeString()}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{log.user_name || 'System'}</p>
                            <p className="text-[11px] text-muted-foreground">{log.user_email || '—'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] font-medium ${actionColors[log.action] || 'bg-muted text-muted-foreground border-border'}`}>
                            {formatAction(log.action)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {log.organization_name ? (
                            <div className="flex items-center gap-1.5 p-1 px-2 border border-border rounded w-max bg-card/50">
                               <span className="text-[12px] font-medium text-foreground">{log.organization_name}</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[250px] truncate text-[12px]">
                          {metaItems.slice(0, 2).map(m => `${m.key}: ${m.value}`).join(' · ') || '—'}
                        </td>
                      </tr>
                      {isExpanded && metaItems.length > 0 && (
                        <tr key={`${log.id}-detail`} className="bg-muted/5">
                          <td colSpan={6} className="px-8 py-3 border-b border-border/50">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {metaItems.map(m => (
                                <div key={m.key}>
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{m.key}</p>
                                  <p className="text-[12px] text-foreground font-mono break-all">{m.value}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-[13px] text-muted-foreground">Page {page} of {Math.ceil(total / 50)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
