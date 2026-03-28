import i18n from 'i18next';
import type { ErrorCode } from './errorCodes';
import { ApiError } from './apiError';

/**
 * Get a user-friendly translated message for an ErrorCode.
 * Falls back to the code itself if no translation is found.
 */
export function getErrorMessage(code: ErrorCode | string): string {
  const key = `apiErrors.${code}`;
  const translated = i18n.t(key);
  // i18next returns the key itself when no translation exists
  if (translated === key) {
    return i18n.t('apiErrors.UNKNOWN', 'An unexpected error occurred.');
  }
  return translated;
}

/**
 * Extract a user-friendly translated message from any error.
 * Priority: ErrorCode translation → backend message → fallback.
 */
export function getTranslatedErrorMessage(err: unknown, fallback?: string): string {
  const defaultMsg = fallback ?? i18n.t('apiErrors.UNKNOWN', 'An unexpected error occurred.');

  if (ApiError.is(err)) {
    // Try translated message from error code first
    const translated = getErrorMessage(err.code);
    // If we got a real translation (not the UNKNOWN fallback), use it
    const unknownMsg = i18n.t('apiErrors.UNKNOWN', 'An unexpected error occurred.');
    if (translated !== unknownMsg) return translated;
    // Fall back to the backend's error message
    return err.message || defaultMsg;
  }

  if (err && typeof err === 'object') {
    const anyErr = err as any;
    if (typeof anyErr.code === 'string') {
      const translated = getErrorMessage(anyErr.code);
      const unknownMsg = i18n.t('apiErrors.UNKNOWN', 'An unexpected error occurred.');
      if (translated !== unknownMsg) return translated;
    }
    if (typeof anyErr.message === 'string' && anyErr.message.trim()) {
      return anyErr.message;
    }
  }

  if (typeof err === 'string' && err.trim()) return err;

  return defaultMsg;
}
