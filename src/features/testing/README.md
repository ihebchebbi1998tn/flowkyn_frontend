# Flowkyn API Test Runner

> Browser-based integration test suite for the Flowkyn REST API.
> Accessible at `tests.flowkyn.com` or via `?app=tests` on preview/localhost.

## Architecture

```
src/tests/
├── README.md           # This file
├── types.ts            # Shared TypeScript interfaces (TestCase, TestResult, RequestInfo, etc.)
├── helpers.ts          # Core utilities: apiCall(), Assertions, cURL builder, exporters
└── suites/             # Test suites grouped by API domain
    ├── index.ts        # Barrel — composes all suites in execution order
    ├── system.tests.ts         # Health, CORS, 404, latency, docs
    ├── auth.tests.ts           # Register, login, tokens, guards, password flows
    ├── users.tests.ts          # Profile CRUD, pagination, avatar upload
    ├── organizations.tests.ts  # Org CRUD, members, invitations, logo
    ├── events.tests.ts         # Event lifecycle: create → join → messages → posts → invite
    ├── games.tests.ts          # Game types, sessions, rounds, actions
    ├── leaderboards.tests.ts   # Leaderboard retrieval, edge cases
    ├── files.tests.ts          # File upload (real image + error cases)
    ├── notifications.tests.ts  # List, paginate, mark-as-read
    ├── analytics.tests.ts      # Event tracking
    ├── contact.tests.ts        # Contact form submissions & validation
    ├── emails.tests.ts         # Email-triggering endpoints (forgot-password, invitations)
    ├── websockets.tests.ts     # Socket.io handshake across namespaces
    ├── admin.tests.ts          # Admin-only endpoints (stats, users, audit logs)
    └── cleanup.tests.ts        # Teardown: delete test resources created during the run
```

## Execution Order

Tests run **sequentially** in a specific order because later suites depend on
resources created by earlier ones (e.g., Events need an Org ID from Organizations):

1. **System** — Verify server is reachable, CORS works, error format is correct
2. **Auth** — Register/login to obtain JWT tokens for authenticated tests
3. **Users** — Profile operations using the authenticated user
4. **Organizations** — Create an org (stores `orgId` in shared context)
5. **Events** — Create event under that org (stores `eventId`, `participantId`)
6. **Games** — Start game sessions under the event
7. **Leaderboards** — Query leaderboard endpoints
8. **Files** — Upload/list files
9. **Notifications** — List/mark notifications
10. **Analytics** — Track analytics events
11. **Contact** — Submit contact forms (no auth required)
12. **Emails** — Trigger email flows (forgot-password, invitations)
13. **WebSockets** — Socket.io handshake tests
14. **Admin** — Admin-only endpoints (expect 403 for non-admin users)
15. **Cleanup** — Delete event + org created during the run
16. **Auth (logout)** — Invalidate the session

## Shared Context (`TestContext`)

All suites share a `TestContext` object that carries:

| Field           | Description                                      |
|-----------------|--------------------------------------------------|
| `baseUrl`       | API base URL (`https://api.flowkyn.com/v1`)      |
| `token`         | JWT access token (set after login)               |
| `refreshToken`  | JWT refresh token (set after login)              |
| `createdIds`    | Map of resource IDs created during the run       |

Common `createdIds` keys: `userId`, `orgId`, `eventId`, `participantId`,
`sessionId`, `roundId`, `gameTypeId`, `postId`, `memberId`, `notificationId`.

## Key Helpers

- **`apiCall()`** — Fetch wrapper that auto-generates cURL commands, tracks request metadata
- **`Assertions`** — Fluent assertion builder (`.check(label, condition)`)
- **`testWebSocket()`** — Socket.io polling transport handshake test
- **`exportAsJSON()` / `exportAsCSV()`** — Download test results

## Adding a New Test Suite

1. Create `src/tests/suites/myfeature.tests.ts`
2. Export a function `myfeatureTests(): TestCase[]`
3. Use `defineTest()` to register individual tests
4. Import and add to `buildAllTests()` in `index.ts`

## UI Component

The test runner UI lives at `src/pages/tests/UITests.tsx` and renders:
- Server health status indicator
- Credential input (login/signup modes)
- Test list grouped by category with expand/collapse
- Per-test: assertions checklist, cURL command, request headers/body, response body
- Export to JSON/CSV
