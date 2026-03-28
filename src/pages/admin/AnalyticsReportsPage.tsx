import { useState } from 'react';
import { useReportsList, useCreateReport, useUpdateReport, useDeleteReport, useGenerateEngagementReport, useGenerateUsageReport, useGenerateRetentionReport, useExportReportCsv, useExportReportJson, useScheduleReport, useGetScheduledReports } from '@/hooks/useAnalyticsReports';
import { CreateReportRequest } from '@/api/analyticsReports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Download, FileText, Calendar, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AnalyticsReportsPage() {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<'engagement' | 'usage' | 'retention'>('engagement');

  const { data: reportsData, isLoading: isLoadingReports } = useReportsList(undefined, page, limit);
  const { data: scheduledReports, isLoading: isLoadingScheduled } = useGetScheduledReports();
  const createMutation = useCreateReport();
  const deleteMutation = useDeleteReport('');
  const generateEngagementMutation = useGenerateEngagementReport();
  const generateUsageMutation = useGenerateUsageReport();
  const generateRetentionMutation = useGenerateRetentionReport();
  const exportCsvMutation = useExportReportCsv('');
  const exportJsonMutation = useExportReportJson('');
  const scheduleMutation = useScheduleReport();

  const handleGenerateReport = async () => {
    const mutations: Record<string, any> = {
      engagement: generateEngagementMutation,
      usage: generateUsageMutation,
      retention: generateRetentionMutation,
    };
    await mutations[reportType].mutateAsync();
  };

  const handleExportCsv = async (reportId: string) => {
    try {
      const blob = await exportCsvMutation.mutateAsync();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.csv`;
      a.click();
    } catch (error) {
      alert(t('analyticsReports.exportError'));
    }
  };

  const handleExportJson = async (reportId: string) => {
    try {
      const content = await exportJsonMutation.mutateAsync();
      const blob = new Blob([content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.json`;
      a.click();
    } catch (error) {
      alert(t('analyticsReports.exportError'));
    }
  };

  const handleSchedule = async (reportId: string) => {
    const frequency = prompt(
      `${t('analyticsReports.selectFrequency')}\n1: Daily\n2: Weekly\n3: Monthly\n4: Quarterly`
    );
    const frequencyMap: Record<string, 'daily' | 'weekly' | 'monthly' | 'quarterly'> = {
      '1': 'daily',
      '2': 'weekly',
      '3': 'monthly',
      '4': 'quarterly',
    };
    if (frequency && frequencyMap[frequency]) {
      await scheduleMutation.mutateAsync({ id: reportId, frequency: frequencyMap[frequency] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('analyticsReports.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('analyticsReports.description')}</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('analyticsReports.generateReport')}
        </Button>
      </div>

      {/* Generate Report Form */}
      {showCreateForm && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle>{t('analyticsReports.generateNew')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('analyticsReports.reportName')}</label>
                <Input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Report name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('analyticsReports.reportType')}</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="engagement">Engagement Report</option>
                  <option value="usage">Usage Report</option>
                  <option value="retention">Retention Report</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={generateEngagementMutation.isPending || generateUsageMutation.isPending || generateRetentionMutation.isPending}
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                {t('analyticsReports.generate')}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports */}
      {isLoadingScheduled ? null : scheduledReports && scheduledReports.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('analyticsReports.scheduledReports')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scheduledReports.map((report: any) => (
                <div key={report.id} className="p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm font-medium">{report.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('analyticsReports.frequency')}: {report.schedule_frequency}
                  </p>
                  {report.next_scheduled_at && (
                    <p className="text-xs text-muted-foreground">
                      Next: {new Date(report.next_scheduled_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {isLoadingReports ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : reportsData?.data?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('analyticsReports.noReports')}</p>
            </CardContent>
          </Card>
        ) : (
          reportsData?.data?.map((report: any) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{report.name}</h3>
                      <Badge variant={report.is_scheduled ? 'default' : 'secondary'}>
                        {report.report_type}
                      </Badge>
                      {report.is_scheduled && (
                        <Badge variant="outline">{report.schedule_frequency}</Badge>
                      )}
                      {report.is_public && (
                        <Badge variant="outline">{t('analyticsReports.public')}</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {report.date_from && (
                        <span>
                          {t('analyticsReports.from')}: {new Date(report.date_from).toLocaleDateString()}
                        </span>
                      )}
                      {report.date_to && (
                        <span>
                          {t('analyticsReports.to')}: {new Date(report.date_to).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        {t('analyticsReports.generated')}: {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    {report.expires_at && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⏰ {t('analyticsReports.expires')}: {new Date(report.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportCsv(report.id)}
                      disabled={exportCsvMutation.isPending}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportJson(report.id)}
                      disabled={exportJsonMutation.isPending}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      JSON
                    </Button>
                    {!report.is_scheduled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSchedule(report.id)}
                        disabled={scheduleMutation.isPending}
                        className="gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        {t('analyticsReports.schedule')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {reportsData && (
        <div className="flex justify-between items-center py-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('common.page')} {page}
          </span>
          <Button
            variant="outline"
            disabled={!reportsData.data || reportsData.data.length < limit}
            onClick={() => setPage(page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
