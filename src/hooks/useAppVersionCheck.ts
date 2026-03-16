import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL = 60_000; // 60 seconds
const MIN_CHECK_INTERVAL = 2_000; // Throttle: min 2s between checks

export function useAppVersionCheck() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const currentVersion = useRef<string | null>(null);
  const lastCheck = useRef(0);
  const checkCounter = useRef(0);

  const checkVersion = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheck.current < MIN_CHECK_INTERVAL) return;
    lastCheck.current = now;

    try {
      checkCounter.current++;
      const res = await fetch(`/version.json?t=${now}&check=${checkCounter.current}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const version = data?.v;
      if (!version) return;

      if (currentVersion.current === null) {
        currentVersion.current = version;
        return;
      }

      if (version !== currentVersion.current) {
        console.log(`🔄 New version detected: ${currentVersion.current} → ${version}`);
        setIsUpdateAvailable(true);
      }
    } catch {
      // Network error — silently continue
    }
  }, []);

  const refreshApp = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, POLL_INTERVAL);

    // Check on tab focus
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [checkVersion]);

  return { isUpdateAvailable, refreshApp, setIsUpdateAvailable };
}
