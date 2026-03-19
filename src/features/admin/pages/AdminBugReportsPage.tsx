import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle, Search, Filter, CheckCircle, Clock, Trash2,
  BarChart3, TrendingUp, Edit2, Loader2
} from 'lucide-react';
import { LogoLoader } from '@/components/loading/LogoLoader';
import { bugReportsApi } from '@/features/app/api/bugReports';
import type { BugReportListItem, BugReportStats } from '@/features/app/api/bugReports';

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

export const AdminBugReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<BugReportListItem[]>([]);
  const [stats, setStats] = useState<BugReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
    loadStats();
  }, [page, statusFilter, priorityFilter, search]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await bugReportsApi.listAdvanced({
        page,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: search || undefined,
      });

      setReports(result.data ?? []);
      setTotalPages(result.pagination.totalPages);
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        'Failed to load reports';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await bugReportsApi.getStats();
      setStats(data.data);
    } catch (err: unknown) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleUpdateReport = async (
    reportId: string,
    updates: { status?: string; priority?: string }
  ) => {
    setUpdatingReportId(reportId);
    try {
      await bugReportsApi.update(reportId, {
        status: updates.status,
        priority: updates.priority,
      });
      await loadReports();
      await loadStats();
      setSelectedReport(null);
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        'Failed to update report';
      setError(message);
    } finally {
      setUpdatingReportId(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await bugReportsApi.delete(reportId);
      await loadReports();
      await loadStats();
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        'Failed to delete report';
      setError(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 font-bold';
      case 'high':
        return 'bg-orange-100 text-orange-800 font-semibold';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bug_report: '🐛 Bug',
      feature_request: '✨ Feature',
      issue: '⚠️ Issue',
      general_feedback: '💬 Feedback',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('bugReports.adminTitle')}</h1>
          <p className="text-gray-600">{t('bugReports.adminSubtitle')}</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{t('bugReports.stats.totalReports')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{t('bugReports.stats.openCount')}</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.openCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{t('bugReports.stats.inProgressCount')}</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgressCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{t('bugReports.stats.resolvedCount')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">{t('bugReports.errorTitle')}</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              {t('common.search')}
            </label>
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('bugReports.search')}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              {t('bugReports.filterStatus')}
            </label>
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('bugReports.allStatuses')}</option>
              <option value="open">{t('bugReports.statusOpen')}</option>
              <option value="in_progress">{t('bugReports.statusInProgress')}</option>
              <option value="resolved">{t('bugReports.statusResolved')}</option>
              <option value="closed">{t('bugReports.statusClosed')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('bugReports.priorityLabel')}
            </label>
            <select
              value={priorityFilter}
              onChange={e => {
                setPriorityFilter(e.target.value as PriorityFilter);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('bugReports.allTypes')}</option>
              <option value="low">{t('bugReports.priorityLow')}</option>
              <option value="medium">{t('bugReports.priorityMedium')}</option>
              <option value="high">{t('bugReports.priorityHigh')}</option>
              <option value="critical">{t('bugReports.priorityCritical')}</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setPage(1);
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {t('bugReports.clearFilters')}
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LogoLoader size="md" />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600">{t('bugReports.noReports')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{t('common.search')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{t('bugReports.reporter')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{t('bugReports.typeSelection')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{t('bugReports.priorityLabel')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{t('common.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">{t('bugReports.created')}</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-blue-600 hover:underline font-medium line-clamp-1 text-sm"
                        >
                          {report.title}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 font-medium">{report.user_name}</div>
                        <div className="text-gray-500 text-xs">{report.user_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-gray-700">{getTypeLabel(report.type)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(report.priority)}`}>
                          {report.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title={t('bugReports.viewDetails')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title={t('bugReports.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 disabled:opacity-50 text-sm"
              >
                {t('common.previous')}
              </button>
              <span className="text-sm text-gray-600">
                {t('common.page')} {page} {t('common.of')} {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 disabled:opacity-50 text-sm"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail/Edit Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{selectedReport.title}</h2>
              <p className="text-gray-600 mb-4">{selectedReport.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">{t('bugReports.typeSelection')}:</span>
                  <span className="ml-2">{getTypeLabel(selectedReport.type)}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">{t('bugReports.reporter')}:</span>
                  <span className="ml-2">{selectedReport.user_name}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">{t('bugReports.created')}:</span>
                  <span className="ml-2">{new Date(selectedReport.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">{t('common.search')}:</span>
                  <span className="ml-2">{selectedReport.attachment_count}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.status')}</label>
                  <select
                    value={editingStatus || selectedReport.status}
                    onChange={e => setEditingStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updatingReportId === selectedReport.id}
                  >
                    <option value="open">{t('bugReports.statusOpen')}</option>
                    <option value="in_progress">{t('bugReports.statusInProgress')}</option>
                    <option value="resolved">{t('bugReports.statusResolved')}</option>
                    <option value="closed">{t('bugReports.statusClosed')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('bugReports.priorityLabel')}</label>
                  <select
                    value={editingPriority || selectedReport.priority}
                    onChange={e => setEditingPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updatingReportId === selectedReport.id}
                  >
                    <option value="low">{t('bugReports.priorityLow')}</option>
                    <option value="medium">{t('bugReports.priorityMedium')}</option>
                    <option value="high">{t('bugReports.priorityHigh')}</option>
                    <option value="critical">{t('bugReports.priorityCritical')}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleUpdateReport(selectedReport.id, {
                      status: editingStatus,
                      priority: editingPriority,
                    });
                  }}
                  disabled={updatingReportId === selectedReport.id}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {updatingReportId === selectedReport.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('bugReports.updating')}
                    </>
                  ) : (
                    t('bugReports.updateReport')
                  )}
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {t('bugReports.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBugReportsPage;
