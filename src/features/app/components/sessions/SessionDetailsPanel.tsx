/**
 * @fileoverview Session Details Panel Component
 *
 * Main component for displaying comprehensive game session details,
 * including participants, messages, actions, timeline, and management controls.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Download, XCircle, Trash2, Clock, Users, MessageSquare, Zap } from 'lucide-react';
import { useSessionDetails, useCloseSession, useDeleteSession, useExportSessionData } from '@/hooks/queries/useSessionsQueries';
import { SessionParticipants, SessionMessages, SessionActions, SessionTimeline } from '.';
import { DashboardSkeleton } from '@/components/loading/Skeletons';

interface SessionDetailsPanelProps {
  sessionId: string;
  enabled?: boolean;
  onClosed?: () => void;
  onDeleted?: () => void;
}

export function SessionDetailsPanel({
  sessionId,
  enabled = true,
  onClosed,
  onDeleted,
}: SessionDetailsPanelProps) {
  const { t } = useTranslation();
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  console.log(`[SessionDetailsPanel] 🎯 Rendering with sessionId: ${sessionId}, enabled: ${enabled}`);

  const { data: session, isLoading, error } = useSessionDetails(sessionId, enabled);
  
  React.useEffect(() => {
    console.log(`[SessionDetailsPanel] 📊 State updated:`, {
      sessionId,
      isLoading,
      hasError: !!error,
      hasSession: !!session,
      enabled,
    });
  }, [sessionId, isLoading, error, session, enabled]);

  const closeSessionMutation = useCloseSession();
  const deleteSessionMutation = useDeleteSession();
  const exportMutation = useExportSessionData();

  if (isLoading) {
    console.log(`[SessionDetailsPanel] ⏳ Loading session details for: ${sessionId}`);
    return <DashboardSkeleton />;
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNotFound = errorMessage.includes('404') || errorMessage.includes('not found');
    
    console.error('[SessionDetailsPanel] ❌ Error loading session:', {
      sessionId,
      errorMessage,
      isNotFound,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorStack: error instanceof Error ? error.stack : undefined,
      fullError: error,
    });

    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-5xl">⚠️</div>
          <h3 className="text-lg font-semibold">
            {isNotFound 
              ? t('error.sessionNotFound', 'Session not found') 
              : t('error.failedToLoadSession', 'Failed to load session')}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {isNotFound 
              ? t('error.sessionNotFoundDescription', 'This session may have been deleted or you do not have permission to view it.')
              : t('error.failedToLoadSessionDescription', 'An error occurred while loading session details. Please try again.')}
          </p>
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2 max-w-md break-words">
            {errorMessage}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log(`[SessionDetailsPanel] 🔄 User clicked retry for session: ${sessionId}`);
              window.location.reload();
            }}
            className="mt-4"
          >
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      </Card>
    );
  }

  if (!session) {
    console.warn('[SessionDetailsPanel] ⚠️ No session data received but no error thrown', { sessionId });
    return (
      <Card className="p-6 text-center">
        <p className="text-amber-600">{t('error.noSessionData', 'No session data available')}</p>
      </Card>
    );
  }

  console.log(`[SessionDetailsPanel] ✅ Session data loaded successfully:`, {
    sessionId,
    gameName: session.game_name,
    status: session.status,
    participants: session.participants?.length,
    messages: session.total_messages,
    actions: session.total_actions,
  });

  const handleCloseSession = async () => {
    try {
      console.log(`[SessionDetailsPanel] 📤 Attempting to close session: ${sessionId}`);
      await closeSessionMutation.mutateAsync(sessionId);
      console.log(`[SessionDetailsPanel] ✅ Session closed successfully: ${sessionId}`);
      setShowCloseDialog(false);
      onClosed?.();
    } catch (err) {
      console.error('Failed to close session:', err);
    }
  };

  const handleDeleteSession = async () => {
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      setShowDeleteDialog(false);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    exportMutation.mutate({ sessionId, format });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header with session info */}
      <Card className="p-6 border-l-4 border-l-blue-500">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{session.event_title}</h2>
              <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
            </div>
            <p className="text-gray-600">{session.game_name}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('session.duration', 'Duration')}</p>
                  <p className="font-semibold">{formatDuration(session.game_duration_minutes)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('session.participants', 'Participants')}</p>
                  <p className="font-semibold">{session.total_participants}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('session.messages', 'Messages')}</p>
                  <p className="font-semibold">{session.total_messages}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">{t('session.actions', 'Actions')}</p>
                  <p className="font-semibold">{session.total_actions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-col ml-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={exportMutation.isPending}
              >
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exportMutation.isPending}
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
            </div>
            {session.status !== 'finished' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCloseDialog(true)}
                disabled={closeSessionMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" />
                {t('session.close', 'Close')}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteSessionMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t('session.delete', 'Delete')}
            </Button>
          </div>
        </div>

        {/* Timing info */}
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">{t('session.started', 'Started')}</p>
            <p className="font-mono">{new Date(session.started_at).toLocaleString()}</p>
          </div>
          {session.ended_at && (
            <div>
              <p className="text-gray-600">{t('session.ended', 'Ended')}</p>
              <p className="font-mono">{new Date(session.ended_at).toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-gray-600">{t('session.round', 'Round')}</p>
            <p className="font-mono">{session.current_round} / {session.total_rounds}</p>
          </div>
        </div>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="participants">
            {t('session.participants', 'Participants')} ({session.total_participants})
          </TabsTrigger>
          <TabsTrigger value="messages">
            {t('session.messages', 'Messages')} ({session.total_messages})
          </TabsTrigger>
          <TabsTrigger value="actions">
            {t('session.actions', 'Actions')} ({session.total_actions})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            {t('session.timelineTab', 'Timeline')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <SessionParticipants participants={session.participants} />
        </TabsContent>

        <TabsContent value="messages">
          <SessionMessages messages={session.messages} sessionId={sessionId} />
        </TabsContent>

        <TabsContent value="actions">
          <SessionActions actions={session.actions} />
        </TabsContent>

        <TabsContent value="timeline">
          <SessionTimeline timeline={session.timeline} />
        </TabsContent>
      </Tabs>

      {/* Close session confirmation dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('session.closeConfirm.title', 'Close Session?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('session.closeConfirm.description', 'This will finish the session for all participants. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleCloseSession} disabled={closeSessionMutation.isPending}>
            {closeSessionMutation.isPending ? t('common.loading', 'Loading...') : t('session.close', 'Close')}
          </AlertDialogAction>
          <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete session confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('session.deleteConfirm.title', 'Delete Session?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('session.deleteConfirm.description', 'This will permanently delete the session and anonymize all messages. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleDeleteSession} disabled={deleteSessionMutation.isPending}>
            {deleteSessionMutation.isPending ? t('common.loading', 'Loading...') : t('session.delete', 'Delete')}
          </AlertDialogAction>
          <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
