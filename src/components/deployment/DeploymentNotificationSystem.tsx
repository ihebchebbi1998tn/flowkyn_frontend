import { useSmoothAppUpdate } from '@/hooks/useSmoothAppUpdate';
import { SmoothUpdateProgress } from './SmoothUpdateProgress';

export function DeploymentNotificationSystem() {
  const { updateProgress, isReloading, cancelUpdate } = useSmoothAppUpdate();

  return (
    <>
      <SmoothUpdateProgress
        progress={updateProgress}
        isReloading={isReloading}
        onCancel={cancelUpdate}
      />
    </>
  );
}
