# Flowkyn — Admin Panel

## Overview

The Flowkyn Admin Panel is a separate interface accessible at `admin.flowkyn.com` for platform super-administrators. It provides full oversight and management of users, organizations, game sessions, contact submissions, and audit logs.

---

## Access & Authentication
de
| Feature | Description |
|---------|-------------|
| **Admin Login** | Dedicated login page at `/login` with admin credentials |
| **Super Admin Role** | Only users with the `super_admin` flag can access |
| **JWT Auth** | Same token-based auth as the main app |
| **Session Persistence** | Admin session restored from stored tokens |
| **Admin Guard** | All admin routes protected by `AdminGuard` component |

> **Security**: Admin status is validated server-side via the `requireSuperAdmin` middleware. No client-side role checks.

---

## Pages & Features

### 📊 Dashboard (`/dashboard`)

| Widget | Description |
|--------|-------------|
| **Total Users** | Count of all registered users |
| **Total Organizations** | Count of all organizations |
| **Active Game Sessions** | Currently running game sessions |
| **Quick Stats** | Overview cards with key platform metrics |

### 👥 Users Management (`/users`)

| Action | Description |
|--------|-------------|
| **List Users** | Paginated table with search |
| **View User Details** | Full profile information |
| **Edit User** | Update user fields (name, email, etc.) |
| **Suspend User** | Disable user account (blocks login) |
| **Unsuspend User** | Re-enable suspended account |
| **Delete User** | Permanently remove user and all related data |

### 🏢 Organizations Management (`/organizations`)

| Action | Description |
|--------|-------------|
| **List Organizations** | Paginated table with search |
| **View Org Details** | Members, events, settings |
| **Delete Organization** | Remove org and cascade-delete all related data |

### 🎮 Game Sessions (`/games`)

| Action | Description |
|--------|-------------|
| **List Sessions** | Paginated list of all game sessions |
| **Session Details** | Game type, participants, scores, status |

### 📧 Contact Submissions (`/contacts`)

| Action | Description |
|--------|-------------|
| **List Submissions** | All contact form entries |
| **View Details** | Full message content and metadata |
| **Update Status** | Mark as read, resolved, archived |
| **Delete** | Remove contact submission |

### 📋 Audit Logs (`/audit-logs`)

The audit log system tracks **35+ action types** across the entire platform.

#### Quick Stats Bar
- **Total Logs** — All-time log count
- **Auth Events** — Login, register, verify, logout
- **Mutations** — Creates, updates, deletes
- **Destructive Actions** — Deletes and suspensions

#### Category Filters
| Category | Actions Tracked |
|----------|----------------|
| **Auth** | `AUTH_REGISTER`, `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_VERIFY_EMAIL`, `AUTH_FORGOT_PASSWORD`, `AUTH_RESET_PASSWORD` |
| **User** | `USER_UPDATE_PROFILE`, `USER_UPLOAD_AVATAR`, `USER_COMPLETE_ONBOARDING` |
| **Organization** | `ORG_CREATE`, `ORG_UPDATE`, `ORG_DELETE`, `ORG_INVITE_MEMBER`, `ORG_REMOVE_MEMBER`, `ORG_ACCEPT_INVITATION` |
| **Event** | `EVENT_CREATE`, `EVENT_UPDATE`, `EVENT_DELETE`, `EVENT_JOIN`, `EVENT_LEAVE`, `EVENT_INVITE`, `EVENT_GUEST_JOIN`, `EVENT_ACCEPT_INVITATION`, `EVENT_SEND_MESSAGE`, `EVENT_CREATE_POST`, `EVENT_REACT_POST` |
| **Game** | `GAME_START_SESSION`, `GAME_START_ROUND`, `GAME_SUBMIT_ACTION`, `GAME_FINISH_SESSION` |
| **Admin** | `ADMIN_UPDATE_USER`, `ADMIN_SUSPEND_USER`, `ADMIN_UNSUSPEND_USER`, `ADMIN_DELETE_USER`, `ADMIN_DELETE_ORG` |
| **Contact** | `CONTACT_SUBMIT`, `CONTACT_UPDATE_STATUS`, `CONTACT_DELETE` |
| **System** | `ANALYTICS_TRACK`, `LEADERBOARD_VIEW` |

#### Log Entry Details
Each log entry contains:
- **Timestamp** — When the action occurred
- **User** — Who performed the action (user ID)
- **Action** — The action type (color-coded by severity)
- **Metadata** — Expandable JSON with full context (IP, user agent, affected resources)

#### Features
- **Search** — Filter logs by user ID or action type
- **Category Tabs** — Quick filter by category
- **Expandable Rows** — Click to view full metadata JSON
- **CSV Export** — Download filtered logs as CSV
- **Manual Refresh** — Reload latest logs

### ⚙️ Settings (`/settings`)

| Setting | Description |
|---------|-------------|
| **Admin Preferences** | Admin-specific settings |

---

## Admin API Endpoints

All endpoints require `Authorization: Bearer <token>` with super-admin privileges.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/admin/stats` | Dashboard statistics |
| GET | `/v1/admin/users` | List users (paginated, searchable) |
| GET | `/v1/admin/users/:id` | Get user by ID |
| PATCH | `/v1/admin/users/:id` | Update user |
| POST | `/v1/admin/users/:id/suspend` | Suspend user |
| POST | `/v1/admin/users/:id/unsuspend` | Unsuspend user |
| DELETE | `/v1/admin/users/:id` | Delete user |
| GET | `/v1/admin/organizations` | List organizations |
| DELETE | `/v1/admin/organizations/:id` | Delete organization |
| GET | `/v1/admin/game-sessions` | List game sessions |
| GET | `/v1/admin/audit-logs` | List audit logs (filterable) |
| GET | `/v1/admin/contact` | List contact submissions |
| GET | `/v1/admin/contact/:id` | Get contact by ID |
| PATCH | `/v1/admin/contact/:id` | Update contact status |
| DELETE | `/v1/admin/contact/:id` | Delete contact |

---

## Security

- All routes protected by `authenticate` + `requireSuperAdmin` middleware
- Admin actions are logged to the audit trail
- No client-side admin role checks — all validation is server-side
- Suspended users cannot log in (checked at auth level)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| State | React Query, AdminAuthContext |
| Routing | React Router v6 with lazy-loaded pages |
| API Client | Dedicated admin API client (`features/admin/api/`) |

---

## File Structure

```
src/features/admin/
├── api/
│   ├── admin.ts        # Admin API methods
│   └── client.ts       # Admin-specific API client
├── components/
│   └── AdminLayout.tsx  # Sidebar + content layout
├── constants/
│   └── routes.ts       # ADMIN_ROUTES definitions
├── context/
│   └── AdminAuthContext.tsx  # Admin auth state
├── guards/
│   └── AdminGuard.tsx  # Route protection
├── pages/
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminUsers.tsx
│   ├── AdminOrganizations.tsx
│   ├── AdminGames.tsx
│   ├── AdminContacts.tsx
│   ├── AdminAuditLogs.tsx
│   └── AdminSettings.tsx
└── routes.tsx          # Admin route definitions
```
