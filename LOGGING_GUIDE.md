# Frontend Console Logging Guide - Session Details Debugging

## Overview
Comprehensive console logging has been added throughout the frontend to help deeply analyze the session details loading process. When you open browser DevTools (F12) and navigate to the Console tab, you'll see detailed logs tracking the entire flow.

## Logging Architecture

### Log Levels with Emojis
- 🎯 - Component initialization
- 📊 - State updates and data changes
- 🔍 - Query/fetch operations starting
- ⏳ - Loading states
- 📤 - Request sent to server
- 📥 - Response received from server
- ✅ - Success operations
- ⚠️ - Warnings
- ❌ - Errors
- 🔄 - Retries
- 💬 - Messages
- 🎮 - Game session operations
- 📥 - Export/download operations
- ⏹️ - Session close/end operations
- 🗑️ - Delete operations
- 🔒 - Modal/UI close operations

## Detailed Log Trace

### 1. User Clicks Session in Games List

**File:** `src/features/app/pages/games/GameList.tsx`

```console
[GameList] 🎮 Component rendered { selectedSessionId: null }
[GameList] 📊 Active sessions updated: {
  count: 3,
  isLoading: false,
  sessions: [
    { id: "session-id-1", name: "Two Truths", status: "active" },
    ...
  ]
}
[GameList] 🔍 Session clicked: { sessionId: "550e8400-e29b-41d4-a716-446655440000" }
[GameList] 🔒 Closing session details modal (when user clicks X)
```

### 2. Session Details Panel Mounts

**File:** `src/features/app/components/sessions/SessionDetailsPanel.tsx`

```console
[SessionDetailsPanel] 🎯 Rendering with sessionId: 550e8400-e29b-41d4-a716-446655440000, enabled: true
[SessionDetailsPanel] ⏳ Loading session details for: 550e8400-e29b-41d4-a716-446655440000
[SessionDetailsPanel] 📊 State updated: {
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  isLoading: true,
  hasError: false,
  hasSession: false,
  enabled: true
}
```

### 3. API Query Hook Initiates

**File:** `src/hooks/queries/useSessionsQueries.ts`

```console
[useSessionDetails] 🔍 Fetching details for session: 550e8400-e29b-41d4-a716-446655440000
```

### 4. API Call Made

**File:** `src/features/app/api/gameSessions.ts`

```console
[gameSessionsApi] 🎮 getSessionDetails called with sessionId: 550e8400-e29b-41d4-a716-446655440000
```

### 5. HTTP Request Sent

**File:** `src/features/app/api/client.ts`

```console
[ApiClient] 📤 GET /game-sessions/550e8400-e29b-41d4-a716-446655440000/details {
  url: "https://api.flowkyn.com/v1/game-sessions/550e8400-e29b-41d4-a716-446655440000/details",
  params: undefined,
  eventId: undefined,
  hasAuthToken: true,
  hasAccessToken: true
}
```

### 6. HTTP Response Received

```console
[ApiClient] 📥 GET /game-sessions/550e8400-e29b-41d4-a716-446655440000/details - Status 200 (234ms)
```

### 7. Success Path

```console
[ApiClient] ✅ GET /game-sessions/550e8400-e29b-41d4-a716-446655440000/details - Success {
  status: 200,
  dataKeys: [
    "id",
    "event_id",
    "event_title",
    "game_name",
    "status",
    "participants",
    "messages",
    "actions",
    "timeline"
  ],
  duration: "234ms"
}

[gameSessionsApi] ✅ getSessionDetails success for 550e8400-e29b-41d4-a716-446655440000: {
  participants: 8,
  messages: 42,
  actions: 156
}

[useSessionDetails] ✅ Successfully fetched session details (235ms) {
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  gameName: "Two Truths and a Lie",
  status: "active",
  participants: 8,
  messages: 42,
  actions: 156,
  totalRounds: 4
}

[SessionDetailsPanel] ✅ Session data loaded successfully: {
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  gameName: "Two Truths and a Lie",
  status: "active",
  participants: 8,
  messages: 42,
  actions: 156
}

[SessionDetailsPanel] 📊 State updated: {
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  isLoading: false,
  hasError: false,
  hasSession: true,
  enabled: true
}
```

## Error Scenarios

### Scenario 1: 404 Session Not Found

```console
[gameSessionsApi] 🎮 getSessionDetails called with sessionId: invalid-id

[ApiClient] 📤 GET /game-sessions/invalid-id/details {
  url: "https://api.flowkyn.com/v1/game-sessions/invalid-id/details",
  hasAuthToken: true
}

[ApiClient] 📥 GET /game-sessions/invalid-id/details - Status 404 (145ms)

[ApiClient] ❌ HTTP Error 404: {
  path: "/game-sessions/invalid-id/details",
  method: "GET",
  status: 404,
  error: "Session not found",
  code: "NOT_FOUND",
  details: undefined,
  url: "https://api.flowkyn.com/v1/game-sessions/invalid-id/details",
  duration: "145ms"
}

[gameSessionsApi] ❌ getSessionDetails failed for invalid-id: {
  error: "Session not found",
  errorCode: "NOT_FOUND"
}

[useSessionDetails] 🔄 Retry decision: {
  failureCount: 0,
  isNotFound: true,
  shouldRetry: false,
  error: "Session not found"
}

[useSessionDetails] ❌ Failed to fetch session invalid-id (146ms): {
  error: "Session not found",
  sessionId: "invalid-id"
}

[SessionDetailsPanel] ❌ Error loading session: {
  sessionId: "invalid-id",
  errorMessage: "Session not found",
  isNotFound: true,
  errorType: "Error",
  errorStack: "Error: Session not found\n    at ..."
}
```

### Scenario 2: 500 Internal Server Error

```console
[ApiClient] 📥 GET /game-sessions/.../details - Status 500 (234ms)

[ApiClient] ❌ HTTP Error 500: {
  path: "/game-sessions/550e8400-e29b-41d4-a716-446655440000/details",
  method: "GET",
  status: 500,
  error: "Correct SQL JOIN conditions in session details service",
  code: "INTERNAL_ERROR",
  details: "Column 'organization_members.name' does not exist",
  duration: "234ms"
}

[useSessionDetails] 🔄 Retry decision: {
  failureCount: 0,
  isNotFound: false,
  shouldRetry: true,
  error: "Correct SQL JOIN conditions in session details service"
}

[useSessionDetails] 🔍 Fetching details for session: 550e8400-e29b-41d4-a716-446655440000
[useSessionDetails] ❌ Failed to fetch session (after 2 retries) ...
```

### Scenario 3: Network Error

```console
[ApiClient] 📤 GET /game-sessions/.../details {
  url: "https://api.flowkyn.com/v1/...",
  hasAuthToken: true
}
[ApiClient] ❌ HTTP Error (Network failed):
  Network request failed or server is unreachable

[useSessionDetails] 🔄 Retry decision: {
  failureCount: 0,
  isNotFound: false,
  shouldRetry: true
}

[useSessionDetails] 🔍 Fetching details for session: ... (Retry 1)
[useSessionDetails] 🔍 Fetching details for session: ... (Retry 2)
[useSessionDetails] ❌ Failed to fetch session after 2 retries
```

## How to Use These Logs

### Step 1: Open Browser DevTools
- **Windows/Linux:** Press `F12` or `Ctrl+Shift+I`
- **Mac:** Press `Cmd+Option+I`

### Step 2: Go to Console Tab
Click on the "Console" tab to see all log messages

### Step 3: Reproduce the Issue
1. Navigate to `/games` page
2. Click on an active session
3. Watch the console logs in real-time

### Step 4: Analyze the Trace
Follow the numbered steps above to understand what's happening at each stage

### Step 5: Copy Logs for Debugging
```javascript
// In browser console, copy all logs:
copy(performance.getEntriesByType('resource').map(r => ({
  name: r.name,
  duration: r.duration,
  status: r.responseStatus
})))
```

## Key Log Checkpoints

### ✅ Successful Flow
1. ✅ GameList session clicked
2. ✅ SessionDetailsPanel mounts
3. ✅ useSessionDetails query starts
4. ✅ gameSessionsApi.getSessionDetails called
5. ✅ ApiClient sends GET request
6. ✅ ApiClient receives 200 status
7. ✅ Data successfully parsed
8. ✅ SessionDetailsPanel displays data

### ❌ Failed Flow
1. ✅ GameList session clicked
2. ✅ SessionDetailsPanel mounts
3. ✅ useSessionDetails query starts
4. ✅ gameSessionsApi.getSessionDetails called
5. ✅ ApiClient sends GET request
6. ❌ ApiClient receives 404/500 status
7. ❌ Error caught in useSessionDetails
8. ❌ Retry logic applies
9. ❌ Final error shown in UI

## Common Issues to Look For

### Issue: No logs at all
**Cause:** Console is filtered or logs aren't being sent
**Check:** Filter console for `[ApiClient]` or `[SessionDetailsPanel]`

### Issue: Request never sent
**Cause:** Query not enabled, sessionId is null, or enabled=false
**Check:** Look for `[useSessionDetails] 🔍 Fetching` log

### Issue: 404 errors
**Cause:** Invalid session ID or session was deleted
**Check:** Verify sessionId in logs matches actual session

### Issue: 500 errors with "Column not found"
**Cause:** SQL query referencing non-existent columns (now fixed)
**Check:** Backend logs should show which column is missing

### Issue: Request hangs
**Cause:** Network timeout or backend not responding
**Check:** Look for ApiClient log without 📥 response log

## Performance Metrics

Each log shows timing information:
```console
[useSessionDetails] ✅ Successfully fetched session details (234ms)
                                                            ^^^^
                                                      Total time
```

**Expected timings:**
- Fast response: 50-200ms
- Normal response: 200-500ms
- Slow response: 500-2000ms
- Timeout: 30000ms+ (should fail)

## Filtering Console Logs

To show only session-related logs:
```javascript
// In browser console:
// Filter: Session
// Shows: [SessionDetailsPanel], [useSessionDetails], [gameSessionsApi]

// Filter: ApiClient
// Shows: [ApiClient] only

// Filter: ✅
// Shows: All successful operations

// Filter: ❌
// Shows: All errors
```

## Creating a Debug Report

To create a complete debug report:
1. Open Console
2. Right-click → Clear console
3. Click session (reproduces the issue)
4. Right-click → Save as (exports all logs)
5. Share the exported file

## Notes

- Logs are environment-safe (only in development/testing)
- No sensitive data is logged (no tokens, passwords)
- Logs use emojis for easy visual scanning
- Logs show request/response timing for performance analysis
- Logs include all error details for troubleshooting
