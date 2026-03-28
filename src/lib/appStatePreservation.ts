/**
 * State Preservation — saves/restores app state across auto-reloads.
 * Stores URL, scroll position, and form drafts in sessionStorage.
 */

const STORAGE_KEY = 'flowkyn-app-state';
const MAX_AGE_MS = 10_000; // Only restore if saved within 10 seconds

interface AppState {
  url: string;
  scrollX: number;
  scrollY: number;
  timestamp: number;
  formDrafts: Record<string, string>;
}

/** Save current app state before a reload */
export function saveAppState(): void {
  try {
    // Collect form drafts
    const formDrafts: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('form-draft-')) {
        formDrafts[key] = sessionStorage.getItem(key) || '';
      }
    }

    const state: AppState = {
      url: window.location.pathname + window.location.search,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      timestamp: Date.now(),
      formDrafts,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Restore app state after a reload. Call once on mount. */
export function restoreAppState(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    sessionStorage.removeItem(STORAGE_KEY);
    const state: AppState = JSON.parse(raw);

    // Only restore if within max age
    if (Date.now() - state.timestamp > MAX_AGE_MS) return;

    // Restore form drafts
    Object.entries(state.formDrafts).forEach(([key, value]) => {
      sessionStorage.setItem(key, value);
    });

    // Restore scroll position with a delay for DOM render
    setTimeout(() => {
      window.scrollTo(state.scrollX, state.scrollY);
    }, 100);
  } catch {
    // Corrupted data — ignore
  }
}
