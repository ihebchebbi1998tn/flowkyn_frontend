import { useSmoothAppUpdate } from '@/hooks/useSmoothAppUpdate';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { SmoothUpdateProgress } from './SmoothUpdateProgress';
import { ConnectionStatusBanner } from './ConnectionStatusBanner';

const API_BASE = import.meta.env.VITE_API_URL;

export function DeploymentNotificationSystem() {
  const { updateProgress, isReloading, cancelUpdate } = useSmoothAppUpdate();
  const { isOnline, isBackendUp } = useConnectionMonitor(
    API_BASE ? `${API_BASE}/health` : undefined
  );

  return (
    <>
      <SmoothUpdateProgress
        progress={updateProgress}
        isReloading={isReloading}
        onCancel={cancelUpdate}
      />
      <ConnectionStatusBanner isOnline={isOnline} isBackendUp={isBackendUp} />
    </>
  );
}
