import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Filter, Loader, Trash2, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { bugReportsApi } from '../../api/bugReports';

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
type TypeFilter = 'all' | 'bug_report' | 'feature_request' | 'issue' | 'general_feedback';

interface BugReport {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  attachment_count?: number;
}

export const MyReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [page, statusFilter, typeFilter, search]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await bugReportsApi.listAdvanced({
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: search || undefined,
      });
      
      setReports(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err: any) {
      setError(
        err.response?.data?.message
        || err.message
        || t('bugReports.errors.loadFailed', { defaultValue: 'Failed to load reports' })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm(t('bugReports.confirmDelete', { defaultValue: 'Are you sure you want to delete this report?' }))) return;

    setDeleting(reportId);
    try {
      await bugReportsApi.delete(reportId);
      setReports(reports.filter(r => r.id !== reportId));
      await loadReports();
    } catch (err: any) {
      setError(
        err.response?.data?.message
        || t('bugReports.errors.deleteFailed', { defaultValue: 'Failed to delete report' })
      );
    } finally {
      setDeleting(null);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'open': return t('bugReports.statusOpen', { defaultValue: 'Open' });
      case 'in_progress': return t('bugReports.statusInProgress', { defaultValue: 'In Progress' });
      case 'resolved': return t('bugReports.statusResolved', { defaultValue: 'Resolved' });
      case 'closed': return t('bugReports.statusClosed', { defaultValue: 'Closed' });
      default: return status.replace(/_/g, ' ');
    }
  };

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return t('bugReports.priorityCritical', { defaultValue: 'Critical' });
      case 'high': return t('bugReports.priorityHigh', { defaultValue: 'High' });
      case 'medium': return t('bugReports.priorityMedium', { defaultValue: 'Medium' });
      case 'low': return t('bugReports.priorityLow', { defaultValue: 'Low' });
      default: return priority;
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
        return 'text-red-600 font-bold';
      case 'high':
        return 'text-orange-600 font-semibold';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return '🐛';
      case 'feature_request':
        return '✨';
      case 'issue':
        return '⚠️';
      case 'general_feedback':
        return '💬';
      default:
        return '📝';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('bugReports.myReports')}</h1>
        <p className="text-gray-600">
          {t('bugReports.myReportsSubtitle')}
        </p>
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Search className="w-4 h-4 inline mr-1" />
            {t('bugReports.search')}
          </label>
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('bugReports.search')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {t('bugReports.filterType')}
          </label>
          <select
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value as TypeFilter);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('bugReports.allTypes')}</option>
            <option value="bug_report">{t('bugReports.bugReport')}</option>
            <option value="feature_request">{t('bugReports.featureRequest')}</option>
            <option value="issue">{t('bugReports.issue')}</option>
            <option value="general_feedback">{t('bugReports.generalFeedback')}</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => window.location.href = '/support/report'}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('bugReports.newReport')}
          </button>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600">{t('bugReports.noReports')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{getTypeIcon(report.type)}</span>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {report.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {report.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                      {statusLabel(report.status)}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(report.priority)}`}>
                      {priorityLabel(report.priority)}
                    </span>
                    {report.attachment_count > 0 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {t('bugReports.attachmentCount', { count: report.attachment_count })}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedReport(report);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title={t('bugReports.viewDetails')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {report.status !== 'resolved' && report.status !== 'closed' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                      disabled={deleting === report.id}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title={t('bugReports.deleteReport')}
                    >
                      {deleting === report.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
              >
                {t('common.previous')}
              </button>
              <span className="text-sm text-gray-600">
                {t('common.page')} {page} {t('common.of')} {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
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

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">{t('common.status')}:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">{t('bugReports.priorityLabel')}:</span>
                  <span className={`ml-2 ${getPriorityColor(selectedReport.priority)}`}>
                    {selectedReport.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">{t('bugReports.created')}:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(selectedReport.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">{t('bugReports.lastUpdated')}:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(selectedReport.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {t('bugReports.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
