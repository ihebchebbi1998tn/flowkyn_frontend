/**
 * Guest token persistence — localStorage with cookie backup.
 * Ensures guest identity survives page refresh and brief storage loss.
 *
 * Cookie is used as backup: if localStorage is empty (e.g. cleared, different subdomain),
 * we restore from cookie. Cookie is httpOnly-safe: we use a same-origin readable cookie
 * since we need to read it client-side for restoration.
 */

const COOKIE_PREFIX = 'flowkyn_guest_';
const IDENTITY_COOKIE_PREFIX = 'flowkyn_guest_identity_';
const COOKIE_MAX_AGE_DAYS = 7;
const COOKIE_PATH = '/';

function cookieKey(eventId: string): string {
  return `${COOKIE_PREFIX}${eventId}`;
}

function identityCookieKey(eventId: string): string {
  return `${IDENTITY_COOKIE_PREFIX}${eventId}`;
}

function randomIdentityKey(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }
  } catch {
    // ignore
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
}

/** Set guest token in localStorage and cookie backup */
export function setGuestToken(eventId: string, token: string): void {
  try {
    const key = `guest_token_${eventId}`;
    localStorage.setItem(key, token);

    // Cookie backup (max 4KB per cookie; JWT usually ~500–1500 chars)
    if (token.length < 3500) {
      const name = cookieKey(eventId);
      const value = encodeURIComponent(token);
      const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
      const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${name}=${value}; path=${COOKIE_PATH}; max-age=${maxAge}; SameSite=Lax${secure}`;
    }
  } catch (e) {
    console.warn('[GuestToken] Failed to persist token', e);
  }
}

/** Get guest token — prefer localStorage, fallback to cookie */
export function getGuestToken(eventId: string): string | null {
  try {
    const key = `guest_token_${eventId}`;
    let token = localStorage.getItem(key);
    if (token) return token;

    // Restore from cookie backup
    const name = cookieKey(eventId);
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    if (match) {
      token = decodeURIComponent(match[1]);
      if (token) {
        localStorage.setItem(key, token);
        return token;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Remove guest token from both localStorage and cookie */
export function clearGuestToken(eventId: string): void {
  try {
    localStorage.removeItem(`guest_token_${eventId}`);
    const name = cookieKey(eventId);
    document.cookie = `${name}=; path=${COOKIE_PATH}; max-age=0`;
  } catch {
    // ignore
  }
}

/** Get stable guest identity key — localStorage with cookie backup */
export function getGuestIdentityKey(eventId: string): string | null {
  try {
    const key = `guest_identity_key_${eventId}`;
    let value = localStorage.getItem(key);
    if (value) return value;

    const name = identityCookieKey(eventId);
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    if (!match) return null;
    value = decodeURIComponent(match[1]);
    if (!value) return null;
    localStorage.setItem(key, value);
    return value;
  } catch {
    return null;
  }
}

/** Persist stable guest identity key */
export function setGuestIdentityKey(eventId: string, keyValue: string): void {
  try {
    const key = `guest_identity_key_${eventId}`;
    localStorage.setItem(key, keyValue);
    const name = identityCookieKey(eventId);
    const value = encodeURIComponent(keyValue);
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${value}; path=${COOKIE_PATH}; max-age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    // ignore
  }
}

/** Return existing key, or generate + persist a new stable key */
export function getOrCreateGuestIdentityKey(eventId: string): string {
  const existing = getGuestIdentityKey(eventId);
  if (existing) return existing;
  const created = randomIdentityKey();
  setGuestIdentityKey(eventId, created);
  return created;
}
