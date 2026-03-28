import { useState } from 'react';
import { useUserEngagementMetrics, useTopUsers, useEngagementStats } from '@/hooks/useUserEngagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function UserEngagementPage() {
  const { t } = useTranslation('admin');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [topLimit, setTopLimit] = useState(10);

  const { data: userMetrics, isLoading: isLoadingUserMetrics } = useUserEngagementMetrics(selectedUserId);
  const { data: topUsers, isLoading: isLoadingTopUsers } = useTopUsers(topLimit);
  const { data: stats, isLoading: isLoadingStats } = useEngagementStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('userEngagement.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('userEngagement.description')}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoadingStats ? (
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('userEngagement.totalUsers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('userEngagement.activeUsers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeToday || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('userEngagement.avgEngagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore?.toFixed(1) || '0'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('userEngagement.topTag')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.topTag || 'N/A'}</div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Search and Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('userEngagement.searchUser')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('userEngagement.userId')}</label>
                <Input
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="mt-1"
                />
              </div>

              {isLoadingUserMetrics ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : selectedUserId && userMetrics ? (
                <div className="space-y-3">
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">{t('userEngagement.metrics')}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('userEngagement.score')}:</span>
                        <p className="font-semibold">{userMetrics.engagement_score?.toFixed(1) || '0'} / 100</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('userEngagement.sessions')}:</span>
                        <p className="font-semibold">{userMetrics.total_sessions || 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('userEngagement.games')}:</span>
                        <p className="font-semibold">{userMetrics.total_games_played || 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('userEngagement.avgDuration')}:</span>
                        <p className="font-semibold">{userMetrics.average_session_duration_minutes || 0}m</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('userEngagement.streak')}:</span>
                        <p className="font-semibold">{userMetrics.current_streak_days || 0}d</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('userEngagement.bestStreak')}:</span>
                        <p className="font-semibold">{userMetrics.highest_streak_days || 0}d</p>
                      </div>
                    </div>
                  </div>

                  {userMetrics.user_tags && userMetrics.user_tags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('userEngagement.tags')}</p>
                      <div className="flex flex-wrap gap-1">
                        {userMetrics.user_tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedUserId ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('userEngagement.noData')}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Top Users */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{t('userEngagement.topUsers')}</CardTitle>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={topLimit}
                  onChange={(e) => setTopLimit(parseInt(e.target.value))}
                  className="w-20"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTopUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : topUsers && topUsers.length > 0 ? (
                <div className="space-y-2">
                  {topUsers.map((user: any, idx: number) => (
                    <div
                      key={user.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                          <div>
                            <p className="text-sm font-medium truncate max-w-40">{user.user_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.total_sessions} sessions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-purple-600">
                            {user.engagement_score?.toFixed(1) || '0'}
                          </p>
                          {user.is_vip && <Badge variant="secondary" className="text-xs">VIP</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('userEngagement.noData')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
