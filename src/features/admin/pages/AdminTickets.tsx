/**
 * Admin Tickets Management Page
 * 
 * Admins can view all bug reports/tickets and manage them (assign, change status, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MoreHorizontal, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { LogoLoader } from '@/components/loading/LogoLoader';
import { adminApi, type BugReportEntry, type BugReportStats } from '@/features/admin/api/admin';
import { toast } from 'sonner';
import { BarChart3, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
};

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800', icon: '🟢' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800', icon: '🔴' },
};

const typeConfig: Record<string, { label: string; icon: string }> = {
  bug_report: { label: 'Bug', icon: '🐛' },
  feature_request: { label: 'Feature', icon: '✨' },
  issue: { label: 'Issue', icon: '⚠️' },
  general_feedback: { label: 'Feedback', icon: '💬' },
};

export default function AdminTickets() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tickets, setTickets] = useState<BugReportEntry[]>([]);
  const [stats, setStats] = useState<BugReportStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<BugReportEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [updatingPriority, setUpdatingPriority] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        adminApi.listBugReports(page, 20, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          priority: priorityFilter === 'all' ? undefined : priorityFilter,
          search: search || undefined,
        }),
        adminApi.getBugReportStats(),
      ]);
      setTickets(ticketsRes.data);
      setTotal(ticketsRes.pagination.total);
      setStats(statsRes.data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSelectTicket = async (ticket: BugReportEntry) => {
    try {
      const detail = await adminApi.getBugReport(ticket.id);
      setSelectedTicket(detail.data);
      setUpdatingStatus(detail.data.status);
      setUpdatingPriority(detail.data.priority);
      setResolutionNotes(detail.data.resolution_notes || '');
      setShowDetailModal(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load ticket details');
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedTicket) return;

    setSavingChanges(true);
    try {
      const updatedTicket = await adminApi.updateBugReport(selectedTicket.id, {
        status: updatingStatus,
        priority: updatingPriority,
        resolutionNotes,
      });

      setSelectedTicket(updatedTicket);
      toast.success('Ticket updated successfully');
      fetchData(); // Refresh list
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update ticket');
    } finally {
      setSavingChanges(false);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ticket Management" subtitle="Manage all bug reports and feature requests" />
        <div className="py-20 flex justify-center"><LogoLoader size="md" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ticket Management" subtitle="Manage all bug reports and feature requests" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Tickets"
            value={stats.totalReports}
            icon={<BarChart3 className="h-4 w-4" />}
            gradient="primary"
          />
          <StatCard
            title="Open"
            value={stats.openCount}
            icon={<AlertCircle className="h-4 w-4" />}
            gradient="info"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressCount}
            icon={<Clock className="h-4 w-4" />}
            gradient="warning"
          />
          <StatCard
            title="Resolved"
            value={stats.resolvedCount}
            icon={<CheckCircle className="h-4 w-4" />}
            gradient="success"
          />
          <StatCard
            title="Critical"
            value={stats.criticalCount}
            icon={<AlertTriangle className="h-4 w-4" />}
            gradient="destructive"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by title, email..."
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
              Status: {statusFilter === 'all' ? 'All' : (statusConfig[statusFilter]?.label || statusFilter)}
            </DropdownMenuTrigger>
          </Button>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setStatusFilter('all'); setPage(1); }}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(statusConfig).map(([status, config]) => (
              <DropdownMenuItem
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
              >
                <Badge className={config.color}>{config.label}</Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Button asChild variant="outline" className="gap-2">
            <DropdownMenuTrigger>
              <Filter className="w-4 h-4" />
              Priority: {priorityFilter === 'all' ? 'All' : (priorityConfig[priorityFilter]?.label || priorityFilter)}
            </DropdownMenuTrigger>
          </Button>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setPriorityFilter('all'); setPage(1); }}>
              All Priorities
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(priorityConfig).map(([priority, config]) => (
              <DropdownMenuItem
                key={priority}
                onClick={() => { setPriorityFilter(priority); setPage(1); }}
              >
                <span className="mr-2">{config.icon}</span>
                <Badge className={config.color}>{config.label}</Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No tickets found matching your filters</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2 overflow-x-auto">
          <div className="min-w-full">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleSelectTicket(ticket)}
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{typeConfig[ticket.type]?.icon || '📋'}</span>
                    <h3 className="font-medium truncate hover:underline">{ticket.title}</h3>
                    <Badge className={statusConfig[ticket.status]?.color || 'bg-gray-100'}>
                      {statusConfig[ticket.status]?.label || ticket.status}
                    </Badge>
                    <Badge className={priorityConfig[ticket.priority]?.color || 'bg-gray-100'}>
                      {priorityConfig[ticket.priority]?.icon || ''} {priorityConfig[ticket.priority]?.label || ticket.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span>From: {ticket.user_name || ticket.user_email}</span>
                    {ticket.assigned_to_name && (
                      <>
                        <span>•</span>
                        <span>Assigned to: {ticket.assigned_to_name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <MoreHorizontal className="w-4 h-4 text-muted-foreground ml-4 flex-shrink-0" />
              </div>
            ))}
          </div>
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

      {/* Detail Modal */}
      {selectedTicket && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{typeConfig[selectedTicket.type]?.icon || '📋'}</span>
                {selectedTicket.title}
              </DialogTitle>
              <DialogDescription>
                Ticket #{selectedTicket.id.slice(0, 8)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Description */}
              <div>
                <h4 className="font-medium text-sm mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                  {selectedTicket.description}
                </p>
              </div>

              {/* From */}
              <div>
                <h4 className="font-medium text-sm mb-2">From</h4>
                <p className="text-sm">
                  {selectedTicket.user_name} ({selectedTicket.user_email})
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <DropdownMenu>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <DropdownMenuTrigger>
                      {statusConfig[updatingStatus]?.label || updatingStatus}
                      <ChevronDown className="w-4 h-4" />
                    </DropdownMenuTrigger>
                  </Button>
                  <DropdownMenuContent className="w-56">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => setUpdatingStatus(status)}
                      >
                        <Badge className={config.color}>{config.label}</Badge>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <DropdownMenu>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <DropdownMenuTrigger>
                      {priorityConfig[updatingPriority]?.icon} {priorityConfig[updatingPriority]?.label || updatingPriority}
                      <ChevronDown className="w-4 h-4" />
                    </DropdownMenuTrigger>
                  </Button>
                  <DropdownMenuContent className="w-56">
                    {Object.entries(priorityConfig).map(([priority, config]) => (
                      <DropdownMenuItem
                        key={priority}
                        onClick={() => setUpdatingPriority(priority)}
                      >
                        <span className="mr-2">{config.icon}</span>
                        <Badge className={config.color}>{config.label}</Badge>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
                <Textarea
                  placeholder="Add notes about the resolution or any findings..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Attachments */}
              {/* TODO: Display attachments if any */}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
                disabled={savingChanges}
              >
                Close
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={savingChanges}
                className="gap-2"
              >
                {savingChanges && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingChanges ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
