import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { PageShell, PageHeader } from '@/features/app/components/dashboard';
import { SessionDetailsPanel } from '@/features/app/components/sessions';
import { Button } from '@/components/ui/button';

export default function SessionDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  if (!sessionId) {
    return (
      <PageShell>
        <PageHeader title={t('session.sessionNotFound', 'Session Not Found')} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <PageHeader
            title={t('session.detailsTitle', 'Session Details')}
            subtitle={`${t('session.sessionId', 'Session ID')}: ${sessionId.substring(0, 8)}...`}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back')}
        </Button>
      </div>

      <div className="bg-background rounded-lg border border-border p-6">
        <SessionDetailsPanel
          sessionId={sessionId}
          enabled={true}
          onClosed={() => {
            console.log('[SessionDetailsPage] Session closed, navigating back');
            navigate(-1);
          }}
          onDeleted={() => {
            console.log('[SessionDetailsPage] Session deleted, navigating back');
            navigate(-1);
          }}
        />
      </div>
    </PageShell>
  );
}
