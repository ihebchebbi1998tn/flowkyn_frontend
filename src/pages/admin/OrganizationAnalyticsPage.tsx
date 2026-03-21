import { useState } from 'react';
import { useOrganizationDashboard, useOrganizationMetrics, useTopOrganizations, useAtRiskOrganizations } from '@/hooks/useOrganizationAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OrganizationAnalyticsPage() {
  const { t } = useTranslation('admin');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const { data: dashboard, isLoading: isLoadingDashboard } = useOrganizationDashboard();
  const { data: orgMetrics, isLoading: isLoadingOrgMetrics } = useOrganizationMetrics(selectedOrgId);
  const { data: topOrgs, isLoading: isLoadingTopOrgs } = useTopOrganizations(10);
  const { data: atRiskOrgs, isLoading: isLoadingAtRisk } = useAtRiskOrganizations(40);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('orgAnalytics.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('orgAnalytics.description')}</p>
      </div>

      {/* Dashboard Stats */}
      {isLoadingDashboard ? (
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('orgAnalytics.totalOrganizations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalOrganizations || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('orgAnalytics.avgHealthScore')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboard.averageHealthScore?.toFixed(1) || '0'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('orgAnalytics.healthy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboard.organizationsAboveThreshold || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('orgAnalytics.atRisk')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboard.organizationsBelowThreshold || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('orgAnalytics.activeMembers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalActiveMembers || 0}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Search */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('orgAnalytics.searchOrg')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('orgAnalytics.organizationId')}</label>
                <Input
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  placeholder="Enter organization ID"
                  className="mt-1"
                />
              </div>

              {isLoadingOrgMetrics ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : selectedOrgId && orgMetrics ? (
                <div className="space-y-3">
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">{t('orgAnalytics.metrics')}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.healthScore')}:</span>
                        <p className="font-semibold">{orgMetrics.health_score?.toFixed(1) || '0'} / 100</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.totalMembers')}:</span>
                        <p className="font-semibold">{orgMetrics.member_count || 0}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.activeMembers')}:</span>
                        <p className="font-semibold">{orgMetrics.active_member_count || 0}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.engagementScore')}:</span>
                        <p className="font-semibold">{orgMetrics.average_engagement_score?.toFixed(1) || '0'}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.featureAdoption')}:</span>
                        <p className="font-semibold">{orgMetrics.feature_adoption_percentage?.toFixed(1) || '0'}%</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.sessionThisMonth')}:</span>
                        <p className="font-semibold">{orgMetrics.total_sessions_this_month || 0}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.gamesThisMonth')}:</span>
                        <p className="font-semibold">{orgMetrics.total_games_this_month || 0}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.avgDuration')}:</span>
                        <p className="font-semibold">{orgMetrics.average_session_duration_minutes || 0}m</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('orgAnalytics.retentionRate')}:</span>
                        <p className="font-semibold">{(orgMetrics.retention_rate * 100)?.toFixed(1) || '0'}%</p>
                      </div>
                    </div>
                  </div>

                  {orgMetrics.health_score < 40 && (
                    <Badge variant="destructive" className="w-fit gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      {t('orgAnalytics.atRiskWarning')}
                    </Badge>
                  )}
                </div>
              ) : selectedOrgId ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('orgAnalytics.noData')}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* At Risk Organizations */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                {t('orgAnalytics.atRiskOrganizations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAtRisk ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : atRiskOrgs && atRiskOrgs.length > 0 ? (
                <div className="space-y-2">
                  {atRiskOrgs.map((org: any) => (
                    <div
                      key={org.id}
                      className="p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition"
                      onClick={() => setSelectedOrgId(org.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-900 truncate max-w-40">
                            {org.organization_id}
                          </p>
                          <p className="text-xs text-red-700">
                            {org.active_member_count}/{org.member_count} members active
                          </p>
                        </div>
                        <p className="text-sm font-bold text-red-600">
                          {org.health_score?.toFixed(1) || '0'}/100
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-green-600">
                  ✓ {t('orgAnalytics.allHealthy')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Organizations */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {t('orgAnalytics.topOrganizations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTopOrgs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : topOrgs && topOrgs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topOrgs.map((org: any, idx: number) => (
                  <div
                    key={org.id}
                    className="p-4 border rounded-lg hover:shadow-md transition cursor-pointer"
                    onClick={() => setSelectedOrgId(org.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                      <Badge className="text-xs">{org.health_score?.toFixed(0) || '0'}</Badge>
                    </div>
                    <p className="text-xs font-medium truncate mb-2" title={org.organization_id}>
                      {org.organization_id}
                    </p>
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        👥 {org.active_member_count}/{org.member_count}
                      </p>
                      <p className="text-muted-foreground">
                        📊 {org.feature_adoption_percentage?.toFixed(0) || '0'}% adoption
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('orgAnalytics.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
