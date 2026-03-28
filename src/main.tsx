import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreAppState } from "./lib/appStatePreservation";
import { ApiError } from "./lib/apiError";

// Restore app state from previous auto-reload
restoreAppState();

// Ensure ApiError is available globally for any legacy or external error handlers
// that might reference it outside of ES module scope.
(window as any).ApiError = ApiError;

createRoot(document.getElementById("root")!).render(<App />);

/* ─── Service Worker Registration ─── */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for SW updates every 60 seconds
        setInterval(() => { reg.update(); }, 60_000);
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });
  });

  // Log when new SW takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 New Service Worker activated');
  });
}

// ─── Stale bundle TDZ recovery ───────────────────────────────────────────────
// When users load mismatched bundles after deploy, they can hit a TDZ runtime
// error like: "Cannot access 'r' before initialization" during module eval.
// This can happen before React ErrorBoundary mounts, so we recover globally.
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    const message =
      (event as any)?.message ||
      (event as any)?.error?.message ||
      (event as any)?.error?.toString?.() ||
      '';
    const msg = String(message);
    const isStaleBundleTDZ =
      /Cannot access '.*' before initialization/i.test(msg) || /before initialization/i.test(msg);

    if (!isStaleBundleTDZ) return;

    const cacheKey = 'flowkyn_auto_recover_stale_bundle_tdz';
    let attempts = 0;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      attempts = raw ? Number(raw) || 0 : 0;
      if (attempts >= 3) return;
      sessionStorage.setItem(cacheKey, String(attempts + 1));
    } catch {
      // ignore
    }

    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage('CLEAN_CACHE');
      }
    } catch {
      // ignore
    }

    // Also attempt direct CacheStorage cleanup from the page
    // (works even if SW is not controlling).
    void (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // ignore
      }
    })().finally(() => {
      setTimeout(() => window.location.reload(), 700);
    });
  });
}
