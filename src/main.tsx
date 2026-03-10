import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreAppState } from "./lib/appStatePreservation";

// Restore app state from previous auto-reload
restoreAppState();

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
