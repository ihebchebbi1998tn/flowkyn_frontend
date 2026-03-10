# Flowkyn — Main Application

## Overview

Flowkyn is a team engagement platform that helps organizations run interactive events, icebreaker games, and team-building activities. Built with React, TypeScript, and a Node.js backend.

---

## Features

### 🔐 Authentication

| Feature | Description |
|---------|-------------|
| **Register** | Email + password + name signup with language preference |
| **OTP Email Verification** | 6-digit code sent to email; auto-login on verification |
| **Login** | Email/password with JWT access + refresh token pair |
| **Forgot Password** | Email-based reset flow with tokenized link |
| **Reset Password** | Set new password via reset token |
| **Logout** | Invalidates refresh token server-side, clears local storage |
| **Session Restore** | Auto-restores session from stored JWT on page load |
| **Token Refresh** | Automatic 401 retry with refresh token (handled by API client) |

### 👤 User Profile

| Feature | Description |
|---------|-------------|
| **View Profile** | Display name, email, avatar, language, role |
| **Edit Profile** | Update name, email, language |
| **Avatar Upload** | Image picker with crop/preview, uploads to server |
| **Password Change** | Update password from settings |
| **Theme Toggle** | Light / Dark / System mode |
| **Language Selector** | English, French, German — persisted + applied immediately |

### 🚀 Onboarding (New Users)

Mandatory 4-step wizard before accessing the dashboard:

1. **Organization Info** — Name, website, description
2. **Industry** — Select industry category
3. **Goals** — Choose team engagement goals
4. **Branding** — Logo upload, language preference

Completing onboarding triggers a celebration animation and redirects to the dashboard. State tracked via `users.onboarding_completed`.

### 🏢 Organizations

| Feature | Description |
|---------|-------------|
| **Create Organization** | Set up a new org with name, industry, logo |
| **View Organization** | Dashboard with org details, members, events |
| **Update Organization** | Edit name, description, logo |
| **Invite Members** | Email-based invitations with role assignment |
| **Accept Invitation** | Token-based invite acceptance flow |
| **Remove Members** | Admins can remove org members |
| **Member Roles** | Owner, Admin, Moderator, Member |

### 📅 Events

| Feature | Description |
|---------|-------------|
| **Create Event** | Title, description, date, location, game type |
| **View Event** | Event details, participant list, chat, activities |
| **Update Event** | Edit event details (owner/admin only) |
| **Delete Event** | Full cascade delete (messages, sessions, invitations) |
| **Invite Participants** | Email invitations to join events |
| **Accept Event Invitation** | Token-based acceptance |
| **Join Event** | Direct join for org members |
| **Leave Event** | Remove yourself from an event |
| **Guest Join** | Non-registered users can join via guest form |
| **Event Lobby** | Waiting area before event starts, share invite link |
| **Copy Invite Link** | Share event join link |

### 💬 Real-Time Chat

| Feature | Description |
|---------|-------------|
| **Event Chat** | Live messaging within events via WebSocket |
| **Sender Names** | Messages display sender's real name |
| **Typing Indicators** | Shows who is typing in real-time |
| **Message History** | Persisted messages loaded on join |

### 🎮 Games & Activities

| Feature | Description |
|---------|-------------|
| **Activity Catalog** | Browse available team-building activities |
| **Launch Activity** | Start a game session within an event |
| **Game Types** | Coffee Roulette, Two Truths & a Lie, Wins of the Week |
| **Game Play Shell** | Unified game UI with timer, rounds, leaderboard sidebar |
| **Real-Time Game Actions** | Submit answers/votes via WebSocket |
| **Round Management** | Automatic round progression with countdowns |
| **Scoring & Animations** | Animated score updates with confetti |
| **Game Results** | Podium display with final rankings |
| **Leaderboard Sidebar** | Live scores during gameplay |

### 🏆 Leaderboards

| Feature | Description |
|---------|-------------|
| **Event Leaderboard** | Rankings within a single event |
| **Organization Leaderboard** | Cross-event rankings for the org |
| **Score Tracking** | Points accumulated across games |

### 🔔 Notifications

| Feature | Description |
|---------|-------------|
| **Real-Time Notifications** | WebSocket-powered instant notifications |
| **Notification List** | View all notifications with read/unread status |
| **Mark as Read** | Individual or bulk mark-as-read |
| **Notification Types** | Invitations, game starts, messages, etc. |

### 📊 Analytics

| Feature | Description |
|---------|-------------|
| **Analytics Dashboard** | Charts for engagement, participation, activity |
| **Event Tracking** | Frontend events tracked automatically (page views, actions) |
| **35+ Tracked Events** | Login, signup, game actions, navigation, etc. |

### ⚙️ Settings

| Feature | Description |
|---------|-------------|
| **Profile Section** | Edit name, email, avatar |
| **Appearance Section** | Theme toggle (light/dark/system) |
| **Notifications Section** | Notification preferences |
| **Security Section** | Password change |

### 📧 Contact

| Feature | Description |
|---------|-------------|
| **Contact Form** | Public contact form on landing page |
| **Validation** | Client-side form validation with error feedback |

### 🌐 Internationalization (i18n)

- **Supported Languages**: English (en), French (fr), German (de)
- **Auto-Detection**: Browser language detection on first visit
- **Persistence**: Language choice saved to localStorage
- **Full Coverage**: All UI strings, email templates, error messages

### 🎨 Landing Page

| Section | Description |
|---------|-------------|
| **Hero** | Main value proposition with CTA |
| **Problem** | Pain points addressed |
| **Features** | Key platform capabilities |
| **How It Works** | Step-by-step usage guide |
| **Stats** | Platform statistics |
| **Testimonials** | User testimonials |
| **Pricing** | Plan comparison |
| **FAQ** | Frequently asked questions |
| **Contact** | Contact form |
| **Footer** | Links, social, legal |

### 📱 Responsive Design

- Full mobile support with responsive layouts
- Mobile bottom sheet for game leaderboards
- Collapsible sidebar navigation
- Touch-friendly interactions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| State | React Query (TanStack), React Context |
| Routing | React Router v6 |
| Real-Time | Socket.IO Client |
| i18n | i18next |
| Backend | Node.js, Express, PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| WebSocket | Socket.IO (events, games, notifications) |

---

## Project Structure

```
src/
├── features/
│   ├── app/           # Main application (auth, events, games, etc.)
│   │   ├── api/       # API client modules
│   │   ├── components/# UI components (chat, game boards, dashboard)
│   │   ├── context/   # AuthContext, NotificationContext
│   │   ├── guards/    # AuthGuard (protected routes)
│   │   ├── layouts/   # DashboardLayout, Sidebar, Topbar
│   │   └── pages/     # All app pages
│   ├── landing/       # Public landing page
│   ├── admin/         # Admin panel (separate domain)
│   └── templates/     # Design system showcase
├── components/ui/     # shadcn/ui primitives
├── hooks/             # Shared hooks (useTracker, useSocket, etc.)
├── i18n/              # Translation files (en, fr, de)
├── types/             # TypeScript type definitions
└── lib/               # Utilities
```

---

## Environment & Domains

| Domain | Mode | Purpose |
|--------|------|---------|
| `flowkyn.com` | Landing | Public marketing site |
| `app.flowkyn.com` | App | Main application |
| `admin.flowkyn.com` | Admin | Admin panel |
| `tests.flowkyn.com` | Tests | UI test suite |
| `localhost:*` | Dev | All modes available |
