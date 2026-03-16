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

const statusConfig: Record<BugReportStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
};

const priorityConfig: Record<BugReportPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

const typeConfig: Record<BugReportType, { label: string; icon: string }> = {
  bug_report: { label: 'Bug', icon: '🐛' },
  feature_request: { label: 'Feature', icon: '✨' },
  issue: { label: 'Issue', icon: '⚠️' },
  general_feedback: { label: 'Feedback', icon: '💬' },
};

export default function MyTicketsPage() {
  const navigate = useNavigate();
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
      showError(err, 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;

    try {
      await bugReportsApi.delete(id);
      toast.success('Ticket deleted');
      setPage(1);
      fetchTickets();
    } catch (err: any) {
      showError(err, 'Failed to delete ticket');
    }
  };

  const canDelete = (ticket: BugReport) => {
    return ticket.status === 'open' || ticket.status === 'in_progress';
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Tickets" subtitle="Track your bug reports and feature requests" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="My Tickets" subtitle="Track your bug reports and feature requests" />
        <Button onClick={() => navigate('/app/tickets/submit')} className="gap-2">
          <Plus className="w-4 h-4" />
          New Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by title, description..."
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
              Status: {statusFilter === 'all' ? 'All' : statusConfig[statusFilter as BugReportStatus].label}
            </DropdownMenuTrigger>
          </Button>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setStatusFilter('all'); setPage(1); }}>
              All Statuses
            </DropdownMenuItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <DropdownMenuItem
                key={status}
                onClick={() => { setStatusFilter(status as BugReportStatus); setPage(1); }}
              >
                <Badge className={config.color}>{config.label}</Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tickets found</p>
          <Button onClick={() => navigate('/app/tickets/submit')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Ticket
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
                    {statusConfig[ticket.status].label}
                  </Badge>
                  <Badge className={priorityConfig[ticket.priority].color}>
                    {priorityConfig[ticket.priority].label}
                  </Badge>
                  {ticket.assigned_to_name && (
                    <Badge variant="outline" className="text-xs">
                      Assigned to {ticket.assigned_to_name}
                    </Badge>
                  )}
                  {ticket.attachment_count && ticket.attachment_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {ticket.attachment_count} file(s)
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
                    View Details
                  </DropdownMenuItem>
                  {canDelete(ticket) && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(ticket.id)}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
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
            Showing {(page - 1) * 20 + 1} – {Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
