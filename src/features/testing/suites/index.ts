/**
 * @fileoverview Barrel module — composes all test suites in execution order.
 *
 * EXECUTION ORDER MATTERS: Later suites depend on resources created by earlier
 * ones. For example, Events tests need an `orgId` from Organizations, and
 * Games tests need an `eventId` from Events.
 *
 * Order:
 *   System → Auth → Users → Organizations → Events → Games → Leaderboards
 *   → Files → Notifications → Analytics → Contact → Emails → WebSockets
 *   → Admin → Cleanup → Auth (logout)
 */

import type { TestCase } from '../types';

// ── Suite imports (alphabetical) ─────────────────────────────────────────────
import { adminTests } from './admin.tests';
import { analyticsTests } from './analytics.tests';
import { authTests, authLogoutTest } from './auth.tests';
import { cleanupTests } from './cleanup.tests';
import { contactTests } from './contact.tests';
import { emailsTests } from './emails.tests';
import { eventsTests } from './events.tests';
import { filesTests } from './files.tests';
import { gamesTests } from './games.tests';
import { leaderboardsTests } from './leaderboards.tests';
import { notificationsTests } from './notifications.tests';
import { organizationsTests } from './organizations.tests';
import { systemTests } from './system.tests';
import { usersTests } from './users.tests';
import { websocketsTests } from './websockets.tests';

/**
 * Build the complete ordered test suite.
 * Called once by the UI to initialize the test list.
 */
export function buildAllTests(): TestCase[] {
  return [
    // 1. Infrastructure & health
    ...systemTests(),

    // 2. Authentication (register, login, tokens, guards)
    ...authTests(),

    // 3. User profile operations
    ...usersTests(),

    // 4. Organization CRUD (creates orgId for later suites)
    ...organizationsTests(),

    // 5. Event lifecycle (creates eventId, participantId)
    ...eventsTests(),

    // 6. Game sessions & rounds (depends on eventId)
    ...gamesTests(),

    // 7. Leaderboard queries
    ...leaderboardsTests(),

    // 8. File upload & listing
    ...filesTests(),

    // 9. Notification operations
    ...notificationsTests(),

    // 10. Analytics tracking
    ...analyticsTests(),

    // 11. Contact form (no auth required)
    ...contactTests(),

    // 12. Email-triggering endpoints
    ...emailsTests(),

    // 13. WebSocket handshake tests
    ...websocketsTests(),

    // 14. Admin-only endpoints
    ...adminTests(),

    // 15. Cleanup: delete test resources
    ...cleanupTests(),

    // 16. Logout (final — invalidates session)
    ...authLogoutTest(),
  ];
}

// ── Re-exports for direct suite access ───────────────────────────────────────
export { systemTests } from './system.tests';
export { authTests, authLogoutTest } from './auth.tests';
export { usersTests } from './users.tests';
export { organizationsTests } from './organizations.tests';
export { eventsTests } from './events.tests';
export { gamesTests } from './games.tests';
export { leaderboardsTests } from './leaderboards.tests';
export { filesTests } from './files.tests';
export { notificationsTests } from './notifications.tests';
export { analyticsTests } from './analytics.tests';
export { contactTests } from './contact.tests';
export { emailsTests } from './emails.tests';
export { websocketsTests } from './websockets.tests';
export { adminTests } from './admin.tests';
export { cleanupTests } from './cleanup.tests';
