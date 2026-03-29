import { useState, useEffect, useCallback, useRef } from 'react';
import { useIdleDetection } from './useIdleDetection';
import { saveAppState } from '@/lib/appStatePreservation';

const VERSION_CHECK_INTERVAL = 20_000; // Poll every 20s
const AUTO_RELOAD_DELAY = 3_000;       // 3s countdown after idle
const VERSION_CHECK_TIMEOUT = 8_000;   // 8s fetch timeout

export function useSmoothAppUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  const { canSafelyReload } = useIdleDetection();
  const currentVersion = useRef<string | null>(null);
  const checkCounter = useRef(0);
  const reloadTimer = useRef<ReturnType<typeof setTimeout>>();
  const cancelled = useRef(false);

  // Aggressive version check with cache busting
  const checkVersion = useCallback(async () => {
    try {
      checkCounter.current++;
      const now = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), VERSION_CHECK_TIMEOUT);

      const res = await fetch(`/version.json?t=${now}&r=${rand}&c=${checkCounter.current}`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) return;
      const data = await res.json();
      const version = data?.v;
      if (!version) return;

      if (currentVersion.current === null) {
        currentVersion.current = version;
        return;
      }

      if (version !== currentVersion.current) {
        setIsUpdateAvailable(true);
      }
    } catch {
      // Silent failure
    }
  }, []);

  // Auto-reload when idle + update available
  useEffect(() => {
    if (!isUpdateAvailable || !canSafelyReload || cancelled.current) return;

    // Start countdown
    setUpdateProgress(20);
    const t1 = setTimeout(() => setUpdateProgress(50), AUTO_RELOAD_DELAY * 0.3);
    const t2 = setTimeout(() => setUpdateProgress(90), AUTO_RELOAD_DELAY * 0.7);

    reloadTimer.current = setTimeout(() => {
      setIsReloading(true);
      setUpdateProgress(100);
      saveAppState();

      // Clean SW cache before reload
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage('CLEAN_CACHE');
      }

      setTimeout(() => window.location.reload(), 300);
    }, AUTO_RELOAD_DELAY);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(reloadTimer.current);
      if (!isReloading) setUpdateProgress(0);
    };
  }, [isUpdateAvailable, canSafelyReload, isReloading]);

  // Poll for version changes
  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkVersion]);

  const cancelUpdate = useCallback(() => {
    cancelled.current = true;
    clearTimeout(reloadTimer.current);
    setUpdateProgress(0);
    setIsUpdateAvailable(false);
    // Reset cancel after 5 minutes to allow future updates
    setTimeout(() => { cancelled.current = false; }, 5 * 60_000);
  }, []);

  return { isUpdateAvailable, updateProgress, isReloading, cancelUpdate };
}
