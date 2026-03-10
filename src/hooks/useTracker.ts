/**
 * @fileoverview Frontend analytics tracker — fire-and-forget event tracking.
 * 
 * Wraps analyticsApi.track() with:
 * - Silent error handling (never blocks UI)
 * - Auth check (only tracks when logged in)
 * - Deduplication within short windows
 * - Batched page view tracking
 * 
 * Usage:
 *   const { track } = useTracker();
 *   track('event_created', { eventId: '123', title: 'Team Standup' });
 */

import { useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsApi } from '@/features/app/api/analytics';

// Track events seen in last 2 seconds to avoid duplicates
const recentEvents = new Map<string, number>();
const DEDUP_WINDOW = 2000;

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = recentEvents.get(key);
  if (last && now - last < DEDUP_WINDOW) return true;
  recentEvents.set(key, now);
  // Cleanup old entries
  if (recentEvents.size > 50) {
    for (const [k, t] of recentEvents) {
      if (now - t > DEDUP_WINDOW * 5) recentEvents.delete(k);
    }
  }
  return false;
}

/**
 * Fire-and-forget analytics track call.
 * Safe to call anywhere — silently fails if not authenticated.
 */
export function trackEvent(eventName: string, properties: Record<string, unknown> = {}) {
  const token = localStorage.getItem('access_token');
  if (!token) return; // Not logged in, skip

  const dedupKey = `${eventName}:${JSON.stringify(properties)}`;
  if (isDuplicate(dedupKey)) return;

  analyticsApi.track(eventName, {
    ...properties,
    _ts: Date.now(),
    _url: window.location.pathname,
  }).catch(() => {}); // Silent — never block UI
}

/**
 * React hook for analytics tracking.
 * Auto-tracks page views and provides a `track` function.
 */
export function useTracker() {
  const location = useLocation();
  const lastPath = useRef('');

  // Auto-track page views
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      trackEvent('page_view', { path: location.pathname });
    }
  }, [location.pathname]);

  const track = useCallback((eventName: string, properties: Record<string, unknown> = {}) => {
    trackEvent(eventName, properties);
  }, []);

  return { track };
}

// ─── Predefined event names for consistency ──────────────────────────────────

export const TRACK = {
  // Auth
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  REGISTER_START: 'register_start',
  REGISTER_SUCCESS: 'register_success',
  EMAIL_VERIFIED: 'email_verified',
  FORGOT_PASSWORD: 'forgot_password',
  PASSWORD_RESET: 'password_reset',
  LOGOUT: 'logout',

  // Profile
  PROFILE_UPDATED: 'profile_updated',
  AVATAR_UPLOADED: 'avatar_uploaded',
  LANGUAGE_CHANGED: 'language_changed',
  THEME_CHANGED: 'theme_changed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP: 'onboarding_step',

  // Organization
  ORG_CREATED: 'org_created',
  ORG_UPDATED: 'org_updated',
  ORG_MEMBER_INVITED: 'org_member_invited',
  ORG_MEMBER_REMOVED: 'org_member_removed',
  ORG_LOGO_UPLOADED: 'org_logo_uploaded',
  ORG_INVITATION_ACCEPTED: 'org_invitation_accepted',

  // Events
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_DELETED: 'event_deleted',
  EVENT_JOINED: 'event_joined',
  EVENT_LEFT: 'event_left',
  EVENT_INVITED: 'event_invited',
  EVENT_INVITATION_ACCEPTED: 'event_invitation_accepted',
  EVENT_GUEST_JOINED: 'event_guest_joined',
  EVENT_LOBBY_VIEWED: 'event_lobby_viewed',
  EVENT_LINK_COPIED: 'event_link_copied',

  // Games
  GAME_SESSION_STARTED: 'game_session_started',
  GAME_ROUND_STARTED: 'game_round_started',
  GAME_ACTION_SUBMITTED: 'game_action_submitted',
  GAME_SESSION_FINISHED: 'game_session_finished',
  GAME_ENTERED: 'game_entered',
  ACTIVITY_SELECTED: 'activity_selected',

  // Chat
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  POST_CREATED: 'post_created',
  POST_REACTED: 'post_reacted',

  // Navigation
  PAGE_VIEW: 'page_view',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  ANALYTICS_VIEWED: 'analytics_viewed',
  SETTINGS_VIEWED: 'settings_viewed',

  // Contact
  CONTACT_SUBMITTED: 'contact_submitted',

  // Files
  FILE_UPLOADED: 'file_uploaded',

  // Notifications
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATIONS_ALL_READ: 'notifications_all_read',
} as const;
