import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { ErrorState } from '@/components/common/ErrorState';
import { Section, ShowcaseRow, ShowcaseGrid } from './Primitives';

export function FeedbackSection() {
  const [alerts, setAlerts] = useState({ success: true, warning: true, error: true, info: true });

  return (
    <Section id="feedback" title="Feedback & Notifications" description="Toast notifications (Sonner), alert banners, and error states.">
      <ShowcaseRow label="Sonner Toasts (click to trigger)">
        <Button variant="outline" size="sm" onClick={() => toast.success('Changes saved successfully')}>
          <CheckCircle className="h-3.5 w-3.5 text-success" /> Success
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.error('Failed to save changes')}>
          <XCircle className="h-3.5 w-3.5 text-destructive" /> Error
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.warning('Your session will expire soon')}>
          <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Warning
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.info('New version available')}>
          <Info className="h-3.5 w-3.5 text-info" /> Info
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast('Event created', { description: 'Your team building event is now live.' })}>
          <Bell className="h-3.5 w-3.5" /> With Description
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.promise(
          new Promise(resolve => setTimeout(resolve, 2000)),
          { loading: 'Uploading file...', success: 'File uploaded!', error: 'Upload failed' }
        )}>
          Promise Toast
        </Button>
      </ShowcaseRow>

      <ShowcaseGrid label="Alert Banners" cols={2}>
        {alerts.success && <AlertBanner type="success" message="Organization created successfully." onClose={() => setAlerts(a => ({ ...a, success: false }))} />}
        {alerts.warning && <AlertBanner type="warning" message="Your subscription expires in 3 days." onClose={() => setAlerts(a => ({ ...a, warning: false }))} />}
        {alerts.error && <AlertBanner type="error" message="Failed to connect to the server." onClose={() => setAlerts(a => ({ ...a, error: false }))} />}
        {alerts.info && <AlertBanner type="info" message="A new version of the app is available." onClose={() => setAlerts(a => ({ ...a, info: false }))} />}
      </ShowcaseGrid>

      {!Object.values(alerts).some(Boolean) && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setAlerts({ success: true, warning: true, error: true, info: true })}>
            Reset Alerts
          </Button>
        </div>
      )}

      <ShowcaseGrid label="Error States (for failed API calls)" cols={2}>
        <ErrorState message="Failed to load events" description="Check your connection and try again." onRetry={() => toast.info('Retrying...')} />
        <ErrorState message="Network error" description="Unable to reach the server." isNetworkError onRetry={() => toast.info('Retrying...')} />
      </ShowcaseGrid>
    </Section>
  );
}
