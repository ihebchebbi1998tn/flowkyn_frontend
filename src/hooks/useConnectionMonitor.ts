import { useState, useEffect, useCallback, useRef } from 'react';

const HEALTH_CHECK_INTERVAL = 30_000; // 30s

export function useConnectionMonitor(healthUrl?: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBackendUp, setIsBackendUp] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const checkBackend = useCallback(async () => {
    if (!healthUrl || !isOnline) return;
    try {
      const res = await fetch(healthUrl, { cache: 'no-store' });
      setIsBackendUp(res.ok);
    } catch {
      setIsBackendUp(false);
    }
  }, [healthUrl, isOnline]);

  useEffect(() => {
    if (!healthUrl) return;
    checkBackend();
    intervalRef.current = setInterval(checkBackend, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [checkBackend, healthUrl]);

  return { isOnline, isBackendUp };
}
