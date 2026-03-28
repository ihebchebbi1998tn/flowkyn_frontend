/**
 * My Tickets Page
 * 
 * Users can view and manage their submitted tickets/bug reports.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Eye, MoreHorizontal, Trash2, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/loading/Skeletons';
import { bugReportsApi, type BugReportStatus, type BugReportType, type BugReportPriority, type BugReport } from '@/features/app/api/bugReports';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useApiError } from '@/hooks/useApiError';
import { useTranslation } from 'react-i18next';

const statusConfig: Record<BugReportStatus, { i18nKey: string; defaultLabel: string; color: string }> = {
  open: { i18nKey: 'tickets.status.open', defaultLabel: 'Open', color: 'bg-blue-100 text-blue-800' },
  in_progress: { i18nKey: 'tickets.status.inProgress', defaultLabel: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  resolved: { i18nKey: 'tickets.status.resolved', defaultLabel: 'Resolved', color: 'bg-green-100 text-green-800' },
  closed: { i18nKey: 'tickets.status.closed', defaultLabel: 'Closed', color: 'bg-gray-100 text-gray-800' },
};

const priorityConfig: Record<BugReportPriority, { i18nKey: string; defaultLabel: string; color: string }> = {
  low: { i18nKey: 'tickets.priority.low', defaultLabel: 'Low', color: 'bg-green-100 text-green-800' },
  medium: { i18nKey: 'tickets.priority.medium', defaultLabel: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { i18nKey: 'tickets.priority.high', defaultLabel: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { i18nKey: 'tickets.priority.critical', defaultLabel: 'Critical', color: 'bg-red-100 text-red-800' },
};

const typeConfig: Record<BugReportType, { i18nKey: string; defaultLabel: string; icon: string }> = {
  bug_report: { i18nKey: 'tickets.type.bug', defaultLabel: 'Bug', icon: '🐛' },
  feature_request: { i18nKey: 'tickets.type.feature', defaultLabel: 'Feature', icon: '✨' },
  issue: { i18nKey: 'tickets.type.issue', defaultLabel: 'Issue', icon: '⚠️' },
  general_feedback: { i18nKey: 'tickets.type.feedback', defaultLabel: 'Feedback', icon: '💬' },
};

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BugReportStatus | 'all'>('all');
  const [tickets, setTickets] = useState<BugReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showError } = useApiError();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await bugReportsApi.list(page, 20, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
      });
      setTickets(result.data);
      setTotal(result.pagination.total);
    } catch (err: any) {
      showError(err, t('tickets.errors.loadFailed', { defaultValue: 'Failed to load tickets' }));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('tickets.confirmDelete', { defaultValue: 'Are you sure you want to delete this ticket? This action cannot be undone.' }))) return;

    try {
      await bugReportsApi.delete(id);
      toast.success(t('tickets.toast.deleted', { defaultValue: 'Ticket deleted' }));
      setPage(1);
      fetchTickets();
    } catch (err: any) {
      showError(err, t('tickets.errors.deleteFailed', { defaultValue: 'Failed to delete ticket' }));
    }
  };

  const canDelete = (ticket: BugReport) => {
    return ticket.status === 'open' || ticket.status === 'in_progress';
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('tickets.myTicketsTitle', { defaultValue: 'My Tickets' })}
          subtitle={t('tickets.myTicketsSubtitle', { defaultValue: 'Track your bug reports and feature requests' })}
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={t('tickets.myTicketsTitle', { defaultValue: 'My Tickets' })}
          subtitle={t('tickets.myTicketsSubtitle', { defaultValue: 'Track your bug reports and feature requests' })}
        />
        <Button onClick={() => navigate('/app/tickets/submit')} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('tickets.newTicket', { defaultValue: 'New Ticket' })}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tickets.searchPlaceholder', { defaultValue: 'Search tickets by title, description...' })}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <Button asChild variant="outline" className="gap-2">
            <DropdownMenuTrigger>
              <Filter className="w-4 h-4" />
              {t('tickets.statusLabel', { defaultValue: 'Status' })}:{' '}
              {statusFilter === 'all'
                ? t('common.all', { defaultValue: 'All' })
                : t(statusConfig[statusFilter as BugReportStatus].i18nKey, { defaultValue: statusConfig[statusFilter as BugReportStatus].defaultLabel })}
            </DropdownMenuTrigger>
          </Button>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setStatusFilter('all'); setPage(1); }}>
              {t('tickets.allStatuses', { defaultValue: 'All Statuses' })}
            </DropdownMenuItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <DropdownMenuItem
                key={status}
                onClick={() => { setStatusFilter(status as BugReportStatus); setPage(1); }}
              >
                <Badge className={config.color}>{t(config.i18nKey, { defaultValue: config.defaultLabel })}</Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t('tickets.empty', { defaultValue: 'No tickets found' })}</p>
          <Button onClick={() => navigate('/app/tickets/submit')} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('tickets.createFirst', { defaultValue: 'Create Your First Ticket' })}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/app/tickets/${ticket.id}`)}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeConfig[ticket.type].icon}</span>
                  <h3 className="font-medium truncate hover:underline">{ticket.title}</h3>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={statusConfig[ticket.status].color}>
                    {t(statusConfig[ticket.status].i18nKey, { defaultValue: statusConfig[ticket.status].defaultLabel })}
                  </Badge>
                  <Badge className={priorityConfig[ticket.priority].color}>
                    {t(priorityConfig[ticket.priority].i18nKey, { defaultValue: priorityConfig[ticket.priority].defaultLabel })}
                  </Badge>
                  {ticket.assigned_to_name && (
                    <Badge variant="outline" className="text-xs">
                      {t('tickets.assignedTo', { defaultValue: 'Assigned to {{name}}', name: ticket.assigned_to_name })}
                    </Badge>
                  )}
                  {ticket.attachment_count && ticket.attachment_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {t('tickets.attachmentsCount', { defaultValue: '{{count}} file(s)', count: ticket.attachment_count })}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto sm:ml-2">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(`/app/tickets/${ticket.id}`)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('tickets.viewDetails', { defaultValue: 'View Details' })}
                  </DropdownMenuItem>
                  {canDelete(ticket) && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(ticket.id)}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete', { defaultValue: 'Delete' })}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            {t('common.pagination.showing', {
              defaultValue: 'Showing {{from}} – {{to}} of {{total}}',
              from: (page - 1) * 20 + 1,
              to: Math.min(page * 20, total),
              total,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('common.previous', { defaultValue: 'Previous' })}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
            >
              {t('common.next', { defaultValue: 'Next' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
