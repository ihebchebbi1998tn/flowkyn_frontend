# Flowkyn Frontend - Technical Documentation

**Version:** 1.0.0  
**Last Updated:** March 21, 2026  
**Environment:** React 18 + TypeScript + Vite + TailwindCSS

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Admin TIER 1 Features](#admin-tier-1-features)
6. [Architecture & Design Patterns](#architecture--design-patterns)
7. [API Integration](#api-integration)
8. [State Management](#state-management)
9. [Styling & UI](#styling--ui)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [Testing](#testing)
12. [Development Workflow](#development-workflow)
13. [Deployment](#deployment)

---

## 📱 Project Overview

**Flowkyn** is a modern web application built for organizing interactive team games and activities. The frontend provides a comprehensive user experience with public pages, user dashboards, and an advanced admin console.

### Key Objectives:
- ✅ User-friendly game session management
- ✅ Real-time collaboration features
- ✅ Organization-based access control
- ✅ Comprehensive admin dashboard with TIER 1 analytics and content management
- ✅ Multi-language support (EN, FR, DE, ES)
- ✅ Dark mode support
- ✅ Mobile-responsive design

---

## 🛠 Tech Stack

### Core Framework
- **React 18** - UI library with hooks
- **TypeScript** - Static type checking
- **Vite** - Modern build tool with HMR
- **TailwindCSS** - Utility-first CSS framework

### UI Components & Styling
- **Shadcn/ui** - Composable React components built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide Icons** - Beautiful SVG icon library (~400+ icons)
- **Class Variance Authority** - Type-safe component variants

### State Management & Data Fetching
- **React Query (@tanstack/react-query)** - Server state management with caching
- **Context API** - Client state management (Auth, Theme, User)
- **Axios** - HTTP client for API calls

### Routing & Navigation
- **React Router v6** - Client-side routing
- **Lazy code splitting** - Dynamic route loading for TIER 1 features

### Form Management & Validation
- **React Hook Form** - Performant form state management
- **Zod** - TypeScript-first schema validation

### Utilities & Libraries
- **date-fns** - Date/time utilities
- **i18next** - Internationalization framework
- **react-i18next** - React i18n integration
- **clsx** - Utility for conditional CSS classes
- **DiceBear** - Avatar generation library

### Development Tools
- **ESLint** - Code quality linting
- **Vitest** - Unit testing framework
- **@testing-library/react** - Component testing utilities
- **@hookform/resolvers** - Zod validation resolver

---

## 📁 Project Structure

```
flowkyn_frontend/
├── public/                          # Static assets
│   ├── robots.txt
│   ├── sw.js                       # Service worker
│   └── version.json                # Version tracking
│
├── src/
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles
│   ├── vite-env.d.ts              # Vite type definitions
│   │
│   ├── api/                        # API client modules
│   │   ├── client.ts              # Axios instance & base config
│   │   ├── auth.ts                # Authentication endpoints
│   │   ├── users.ts               # User management
│   │   ├── organizations.ts        # Organization operations
│   │   ├── events.ts              # Event/game sessions
│   │   ├── games.ts               # Game management
│   │   ├── posts.ts               # Social posts
│   │   ├── notifications.ts        # Notifications
│   │   ├── leaderboards.ts         # Leaderboard data
│   │   ├── auditLogs.ts            # Audit log retrieval
│   │   ├── contact.ts              # Contact messages
│   │   ├── analytics.ts            # User analytics
│   │   ├── files.ts                # File operations
│   │   ├── admin.ts                # Admin endpoints
│   │   ├── adminClient.ts          # Admin-specific axios
│   │   │
│   │   └── TIER 1 Admin APIs:
│   │       ├── featureFlags.ts      # Feature flag management
│   │       ├── gameContent.ts       # Game content CRUD
│   │       ├── contentModeration.ts # Moderation queue
│   │       ├── userEngagement.ts    # User engagement metrics
│   │       ├── organizationAnalytics.ts # Org analytics
│   │       └── analyticsReports.ts  # Report generation
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # Shadcn/Radix primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── label.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ... (30+ more primitives)
│   │   │
│   │   ├── common/                 # Application-wide components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── cards/                  # Card-based components
│   │   │   ├── GameSessionCard.tsx
│   │   │   ├── UserCard.tsx
│   │   │   └── OrganizationCard.tsx
│   │   │
│   │   ├── admin/                  # TIER 1 shared admin components
│   │   │   ├── DataTable.tsx        # Generic sortable table
│   │   │   ├── FormFields.tsx       # TextInput, SelectInput, CheckboxInput
│   │   │   ├── StatusBadge.tsx      # Status indicators with auto color
│   │   │   ├── Pagination.tsx       # Navigation & page controls
│   │   │   ├── ConfirmDialog.tsx    # Confirmation modal
│   │   │   └── SearchBar.tsx        # Search + filter controls
│   │   │
│   │   ├── guards/                 # Route protection components
│   │   │   └── AdminGuard.tsx       # Admin access control
│   │   │
│   │   ├── layouts/                # Page layout wrappers
│   │   │   └── MainLayout.tsx
│   │   │
│   │   ├── navigation/             # Navigation components
│   │   │   ├── Navbar.tsx
│   │   │   └── MobileMenu.tsx
│   │   │
│   │   ├── notifications/          # Toast/notification UI
│   │   │   └── NotificationCenter.tsx
│   │   │
│   │   ├── tables/                 # Data table components
│   │   │   └── DataGrid.tsx
│   │   │
│   │   ├── modals/                 # Modal dialogs
│   │   │   ├── CreateEventModal.tsx
│   │   │   └── SettingsModal.tsx
│   │   │
│   │   ├── loading/                # Loading states
│   │   │   ├── SkeletonLoader.tsx
│   │   │   └── PageLoader.tsx
│   │   │
│   │   └── deployment/             # Deployment-specific
│   │       └── VersionInfo.tsx
│   │
│   ├── constants/                  # Constant values
│   │   ├── adminRoutes.ts          # Admin path constants
│   │   ├── gameTypes.ts            # Game type definitions
│   │   ├── organizationRoles.ts     # Role constants
│   │   └── userStatuses.ts          # User status options
│   │
│   ├── context/                    # React Context providers
│   │   ├── AdminAuthContext.tsx     # Admin authentication state
│   │   ├── AuthContext.tsx          # User authentication state
│   │   ├── ThemeContext.tsx         # Dark/light mode
│   │   ├── LanguageContext.tsx      # Language selection
│   │   └── NotificationContext.tsx  # Global notifications
│   │
│   ├── features/                   # Feature modules
│   │   ├── admin/                  # Admin console feature
│   │   │   ├── components/
│   │   │   │   └── AdminLayout.tsx  # Admin sidebar + main layout
│   │   │   ├── constants/
│   │   │   │   └── routes.ts        # ADMIN_ROUTES object
│   │   │   ├── hooks/               # Admin-specific hooks
│   │   │   ├── routes.tsx           # Admin routing config
│   │   │   └── utils/               # Admin utilities
│   │   │
│   │   ├── games/                  # Game features
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── routes.tsx
│   │   │   └── utils/
│   │   │
│   │   ├── organizations/          # Organization features
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── routes.tsx
│   │   │   └── utils/
│   │   │
│   │   ├── users/                  # User profile features
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── routes.tsx
│   │   │
│   │   └── auth/                   # Authentication feature
│   │       ├── components/
│   │       ├── hooks/
│   │       └── routes.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Auth context hook
│   │   ├── useTheme.ts             # Theme context hook
│   │   ├── useLocalStorage.ts       # Persistent state
│   │   ├── useDebounce.ts           # Debounced values
│   │   ├── useWindowSize.ts         # Window dimensions
│   │   └── useAsync.ts              # Async operations
│   │   │
│   │   └── TIER 1 Admin Hooks (50+):
│   │       ├── useFeatureFlags.ts   # Query/mutation hooks
│   │       ├── useGameContent.ts
│   │       ├── useContentModeration.ts
│   │       ├── useUserEngagement.ts
│   │       ├── useOrganizationAnalytics.ts
│   │       └── useAnalyticsReports.ts
│   │
│   ├── i18n/                       # Internationalization
│   │   ├── i18n.ts                 # i18next config
│   │   ├── locales/
│   │   │   ├── en.json             # English translations
│   │   │   ├── fr.json             # French translations
│   │   │   ├── de.json             # German translations
│   │   │   └── es.json             # Spanish translations
│   │   └── namespace/              # Translation namespaces
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── utils.ts                # Common utilities
│   │   ├── classNameUtils.ts       # CSS class helpers
│   │   └── apiHelpers.ts           # API response handlers
│   │
│   ├── pages/                      # Page components
│   │   ├── public/
│   │   │   ├── HomePage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   └── PricingPage.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   │
│   │   ├── user/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── GameSessionsPage.tsx
│   │   │   ├── LeaderboardsPage.tsx
│   │   │   └── NotificationsPage.tsx
│   │   │
│   │   ├── organization/
│   │   │   ├── OrganizationPage.tsx
│   │   │   ├── MembersPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── (Legacy admin pages)
│   │       │
│   │       └── TIER 1 Admin Pages:
│   │           ├── FeatureFlagsPage.tsx    # 200+ lines
│   │           ├── GameContentPage.tsx     # 250+ lines
│   │           ├── ModerationQueuePage.tsx # 220+ lines
│   │           ├── UserEngagementPage.tsx  # 240+ lines
│   │           ├── OrganizationAnalyticsPage.tsx # 260+ lines
│   │           └── AnalyticsReportsPage.tsx # 280+ lines
│   │
│   ├── routes/                     # Routing configuration
│   │   ├── AppRoutes.tsx            # Main route definitions
│   │   └── ProtectedRoutes.tsx      # Auth-protected routes
│   │
│   ├── test/                       # Testing utilities
│   │   ├── testUtils.tsx            # Test setup helpers
│   │   ├── mocks/
│   │   │   ├── mockData.ts          # Test data factories
│   │   │   └── mockApi.ts           # MSW (Mock Service Worker)
│   │   └── fixtures/                # Test fixtures
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── api.types.ts             # API response types
│   │   ├── domain.types.ts          # Domain model types
│   │   ├── component.types.ts       # Component prop types
│   │   ├── admin.types.ts           # Admin-specific types
│   │   └── common.types.ts          # Shared types
│   │
│   └── utils/                      # Utility functions
│       ├── validators.ts            # Input validation
│       ├── formatters.ts            # Data formatting
│       ├── stringUtils.ts           # String manipulation
│       ├── dateUtils.ts             # Date operations
│       └── asyncUtils.ts            # Async helpers
│
├── tests/                          # Test suites
│   ├── api/                         # API integration tests
│   ├── e2e/                         # End-to-end tests
│   ├── integration/                 # Component integration tests
│   ├── unit/                        # Unit tests
│   └── setup.ts                     # Test environment setup
│
├── scripts/                        # Build & automation scripts
│   ├── i18n-audit.mjs              # i18n key audit
│   ├── update-version.js           # Version bumper
│   └── build.sh                    # Build automation
│
├── public/
│   └── assets/                     # Static assets
│       ├── logo.png
│       ├── images/
│       └── icons/
│
├── Configuration Files
│   ├── vite.config.ts              # Vite configuration
│   ├── vitest.config.ts            # Vitest configuration
│   ├── tsconfig.json               # TypeScript config
│   ├── tsconfig.app.json           # App-specific TS config
│   ├── tailwind.config.ts           # Tailwind customization
│   ├── postcss.config.js           # PostCSS plugins
│   ├── eslint.config.js            # ESLint rules
│   ├── components.json             # Shadcn config
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Dependencies
│   ├── vercel.json                 # Vercel deployment config
│   └── bun.lockb                   # Package lock (Bun)
│
└── README.md                       # This file
```

---

## 🎮 Core Features

### 1. **User Authentication & Authorization**
- Login/Register with email validation
- Password reset functionality
- Role-based access control (User, Moderator, Admin)
- JWT token management
- Session persistence

### 2. **Game Session Management**
- Create and host game sessions
- Real-time participant tracking
- Multiple game types support:
  - Coffee Roulette (matching/pairing)
  - Two Truths and a Lie
  - Strategic Escape (puzzle solving)
  - Custom games
- Session status tracking (draft, active, completed, archived)

### 3. **Organization Management**
- Create and manage organizations
- Member invitations and role assignments
- Organization settings and customization
- Analytics and reporting at org level
- Audit logs for compliance

### 4. **User Profiles & Leaderboards**
- User profile customization
- Avatar generation (DiceBear)
- Performance tracking and statistics
- Global and organization-specific leaderboards
- Badges and achievement system

### 5. **Social Features**
- Posts and feed system
- Comments and reactions
- Notifications and alerts
- Direct messaging (websocket-based)
- Activity tracking

### 6. **Content & Accessibility**
- Multi-language support (EN, FR, DE, ES)
- Dark/Light mode toggle
- Mobile-responsive design
- WCAG 2.1 accessibility standards
- SEO optimization

---

## ⚙️ Admin TIER 1 Features

The Admin Console includes 6 comprehensive TIER 1 feature modules for enterprise-grade management:

### 1. **Feature Flags Management** ⚡
**Path:** `/admin/tier1/feature-flags`

**Functionality:**
- Create, update, enable/disable feature flags
- Gradual rollout with percentage-based control (0-100%)
- Multi-variant A/B testing (variant_a, variant_b, etc.)
- Targeting rules by:
  - Organization IDs
  - User IDs
  - User tags (custom segmentation)
- Flag history and audit trail
- Real-time flag evaluation tracking

**Data Model:**
```typescript
interface FeatureFlag {
  id: UUID;
  key: string; // Unique identifier
  name: string;
  description?: string;
  enabled: boolean;
  rollout_percentage: 0-100;
  is_multivariant: boolean;
  variants?: { [key: string]: { percentage: number; config: any } };
  targeting_rules?: { org_ids: []; user_ids: []; user_tags: [] };
  created_by: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at?: Timestamp;
}
```

**Features:**
- DataTable with sortable columns
- Search and filter by flag key/name
- Pagination (10, 20, 50, 100 items/page)
- Status badges (enabled/disabled)
- Bulk operations for rollout percentage
- Variant configuration modal
- Targeting rules editor
- Confirmation dialogs for destructive actions
- Loading states and error handling
- Export flag configuration

**React Query Hooks:**
- `useFeatureFlags()` - List all flags with filtering
- `useFeatureFlagDetail()` - Get single flag
- `useCreateFeatureFlag()` - Create mutation
- `useUpdateFeatureFlag()` - Update mutation
- `useDeleteFeatureFlag()` - Delete mutation
- `useEvaluateFlag()` - Test flag evaluation

---

### 2. **Game Content Management** 📦
**Path:** `/admin/tier1/game-content`

**Functionality:**
- Create and manage game content (prompts, puzzles, statements)
- Support for multiple game types:
  - Coffee Roulette (ice-breaker prompts)
  - Two Truths (statements)
  - Strategic Escape (puzzles)
  - Custom content types
- Difficulty level assignment (Easy, Medium, Hard)
- Approval workflow for user-generated content
- Content usage tracking and ratings
- Search and filtering

**Data Model:**
```typescript
interface GameContent {
  id: UUID;
  game_key: string; // 'coffee_roulette', 'two_truths', etc.
  content_type: 'prompt' | 'puzzle' | 'statement' | 'challenge';
  title?: string;
  content: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  created_by: UUID;
  is_approved: boolean;
  is_active: boolean;
  usage_count: number;
  average_rating?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at?: Timestamp;
}
```

**Features:**
- Content library browser with previews
- Difficulty-based filtering
- Game type specific editors
- Approval queue for new content
- Rating and usage analytics
- Bulk enable/disable content
- Content duplication
- Rich text editor integration
- Deletion with cascade handling
- Translation content support

**React Query Hooks:**
- `useGameContent()` - List content with filters
- `useGameContentDetail()` - Single content
- `useCreateGameContent()` - Create mutation
- `useUpdateGameContent()` - Update mutation
- `useDeleteGameContent()` - Delete mutation
- `useApproveContent()` - Approval mutation
- `useContentStats()` - Usage statistics

---

### 3. **Content Moderation Queue** ⚠️
**Path:** `/admin/tier1/moderation-queue`

**Functionality:**
- Review flagged/submitted content
- Multi-status workflow (pending, approved, rejected, flagged)
- Moderation notes and decision tracking
- Audit trail of all moderation actions
- Bulk moderation operations
- Performance metrics for moderators

**Data Model:**
```typescript
interface ContentModerationQueue {
  id: UUID;
  content_id: UUID;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reason_for_flag?: string;
  flagged_by?: UUID;
  moderated_by?: UUID;
  moderation_notes?: string;
  flagged_at: Timestamp;
  moderated_at?: Timestamp;
}
```

**Features:**
- Queue view with priority sorting
- Content preview in modal
- Status change workflow
- Reason selection (predefined + custom)
- Bulk approval/rejection
- Moderator assignment
- SLA tracking (time in queue)
- Performance metrics dashboard
- Appeal mechanism
- Notification to flaggers

**React Query Hooks:**
- `useContentModerationQueue()` - Pending items
- `useModerationItem()` - Single item
- `useApproveContent()` - Approval mutation
- `useRejectContent()` - Rejection mutation
- `useFlagContent()` - Flag mutation
- `useModerationMetrics()` - Stats

---

### 4. **User Engagement Analytics** 📈
**Path:** `/admin/tier1/user-engagement`

**Functionality:**
- User engagement scoring and segmentation
- Activity tracking and trends
- User health indicators
- VIP and inactive user identification
- Engagement by feature/game type
- Churn risk assessment

**Data Model:**
```typescript
interface UserEngagementMetrics {
  id: UUID;
  user_id: UUID;
  engagement_score: 0-100;
  last_active_at?: Timestamp;
  total_sessions: number;
  total_messages_sent: number;
  total_actions_performed: number;
  avg_session_duration_minutes: number;
  favorite_game_type?: string;
  is_active: boolean;
  is_inactive_30d: boolean;
  is_vip: boolean;
  user_tags: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Features:**
- User segmentation table
- Engagement score visualization (gauges, charts)
- Activity timeline
- Feature adoption tracking
- Cohort analysis
- Custom user tagging
- VIP management
- Engagement alerts/thresholds
- Export user segments
- Email campaign integration hooks

**React Query Hooks:**
- `useUserEngagementMetrics()` - List users with metrics
- `useUserEngagementDetail()` - Single user detail
- `useUpdateUserTags()` - Tag assignment
- `useCreateSegment()` - Segment creation
- `useEngagementTrends()` - Trend data
- `useChurnRiskUsers()` - At-risk users

---

### 5. **Organization Analytics** 📊
**Path:** `/admin/tier1/organization-analytics`

**Functionality:**
- Organization health scoring
- Member activity and growth tracking
- Feature adoption across organization
- Session participation metrics
- Health score drivers and insights
- Trend analysis month-over-month

**Data Model:**
```typescript
interface OrganizationEngagementMetrics {
  id: UUID;
  organization_id: UUID;
  org_health_score: 0-100;
  total_members: number;
  active_members: number;
  inactive_members: number;
  total_sessions_this_month: number;
  total_sessions_last_month: number;
  member_growth_percentage: number;
  feature_adoption_percentage: number;
  last_activity_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Features:**
- Organization cards with key metrics
- Health score breakdown
- Member growth visualization
- Session activity charts
- Feature adoption heatmap
- Cohort performance comparison
- Custom metric tracking
- Alert configuration
- Benchmarking against similar orgs
- CSV export of metrics

**React Query Hooks:**
- `useOrganizationMetrics()` - List orgs with metrics
- `useOrganizationDetail()` - Single org analytics
- `useOrganizationTrends()` - Trend data
- `useComparisonMetrics()` - Benchmark data
- `useOrgHealthScore()` - Score breakdown

---

### 6. **Analytics Reports** 📉
**Path:** `/admin/tier1/analytics-reports`

**Functionality:**
- Generate custom analytics reports
- Predefined report templates:
  - User Growth Report
  - Engagement Report
  - Revenue/Session Report
  - Custom Reports
- Scheduled reports (daily, weekly, monthly)
- Multiple export formats (JSON, CSV, PDF)
- Report sharing and public links
- Report expiration management
- Historical report archiving

**Data Model:**
```typescript
interface AnalyticsReport {
  id: UUID;
  name: string;
  report_type: 'user_growth' | 'engagement' | 'revenue' | 'sessions' | 'custom';
  generated_by: UUID;
  date_from?: Date;
  date_to?: Date;
  data: object;
  format: 'json' | 'csv' | 'pdf';
  is_scheduled: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly';
  is_public: boolean;
  created_at: Timestamp;
  expires_at?: Timestamp;
}
```

**Features:**
- Report builder with visual query interface
- Date range selection
- Report type templates
- Custom metric selection
- Filter by organization/user
- Grouping and aggregation options
- Export to JSON, CSV, PDF
- Schedule reports (recurring)
- Public sharing with access tokens
- Report versioning
- Email delivery integration
- Real-time report preview

**React Query Hooks:**
- `useAnalyticsReports()` - List reports
- `useReportDetail()` - Single report
- `useCreateReport()` - Creation mutation
- `useGenerateReport()` - Generation mutation
- `useScheduleReport()` - Schedule mutation
- `useExportReport()` - Export mutation

---

## 🏗 Architecture & Design Patterns

### Component Architecture

#### 1. **Presentational vs Container Pattern**
- **Presentational Components**: Pure UI components (Button, Input, Badge, etc.)
- **Container Components**: Logic-driven components with hooks and state management

#### 2. **Custom Hooks Pattern**
All TIER 1 features use custom hooks for data management:

```typescript
// Example: useFeatureFlags.ts
export function useFeatureFlags(filters?: FilterOptions) {
  return useQuery({
    queryKey: ['admin', 'featureFlags', filters],
    queryFn: () => featureFlagsApi.list(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
}

export function useCreateFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlagInput) => featureFlagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'featureFlags'] });
    },
  });
}
```

#### 3. **API Client Pattern**
Singleton pattern with axios instance:

```typescript
// Example: featureFlags.ts API client
export const featureFlagsApi = {
  list: (filters: Record<string, string>) =>
    apiClient.get('/admin/feature-flags', { params: filters }),
  
  create: (data: Record<string, string>) =>
    apiClient.post('/admin/feature-flags', data),
  
  update: (id: string, data: Record<string, string>) =>
    apiClient.put(`/admin/feature-flags/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete(`/admin/feature-flags/${id}`),
};
```

#### 4. **Shared Component Pattern**
Generic, reusable admin components:

```typescript
// DataTable - Generic table for any data type
<DataTable<FeatureFlag>
  columns={[
    { key: 'key', label: 'Flag Key', sortable: true },
    { key: 'enabled', label: 'Status', sortable: false },
  ]}
  data={flags}
  sorting={{ key: 'key', direction: 'asc' }}
  onSort={handleSort}
/>

// FormFields - Strongly typed form inputs
<FormTextInput
  label="Flag Name"
  value={form.name}
  onChange={(e) => setForm({ ...form, name: e.target.value })}
  error={errors.name}
  hint="Unique identifier for feature"
  required
/>

// StatusBadge - Automatic color mapping
<StatusBadge status="enabled" size="sm" />
```

---

### State Management Strategy

#### Query Client Configuration
```typescript
// React Query setup with appropriate stale times
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Stale Times by Data Type
- **Real-time data** (engagement): 30 seconds
- **User/Org data**: 5 minutes
- **Configuration data** (flags, content): 10 minutes
- **Historical data** (reports): 1 hour
- **Static data** (game types): 24 hours

#### Context for Client State
```typescript
// AuthContext - User authentication state
// ThemeContext - UI theme (dark/light)
// LanguageContext - i18n locale selection
// NotificationContext - Global toast notifications
```

---

## 🔌 API Integration

### API Client Structure

#### Base Configuration
```typescript
// src/api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Endpoints Overview

#### Admin TIER 1 Endpoints
```
GET    /admin/feature-flags              - List all flags
GET    /admin/feature-flags/:id          - Get flag detail
POST   /admin/feature-flags              - Create flag
PUT    /admin/feature-flags/:id          - Update flag
DELETE /admin/feature-flags/:id          - Delete flag
GET    /admin/feature-flags/:id/evaluate - Test evaluation

GET    /admin/game-content               - List content
GET    /admin/game-content/:id           - Get content detail
POST   /admin/game-content               - Create content
PUT    /admin/game-content/:id           - Update content
DELETE /admin/game-content/:id           - Delete content
PATCH  /admin/game-content/:id/approve   - Approve content

GET    /admin/content-moderation         - Moderation queue
PATCH  /admin/content-moderation/:id     - Update moderation status
POST   /admin/content-moderation/:id/notes - Add notes

GET    /admin/user-engagement            - List user metrics
GET    /admin/user-engagement/:userId    - Get user detail
PATCH  /admin/user-engagement/:userId    - Update tags

GET    /admin/organization-analytics     - List org metrics
GET    /admin/organization-analytics/:orgId - Get org analytics

GET    /admin/analytics-reports          - List reports
GET    /admin/analytics-reports/:id      - Get report detail
POST   /admin/analytics-reports          - Generate report
PATCH  /admin/analytics-reports/:id      - Update report
DELETE /admin/analytics-reports/:id      - Delete report
GET    /admin/analytics-reports/:id/export - Export report
```

---

## 📊 State Management

### React Query Query Keys

```typescript
// Centralized query key factory pattern
export const queryKeys = {
  admin: {
    featureFlags: {
      all: ['admin', 'featureFlags'],
      list: (filters?: any) => [...queryKeys.admin.featureFlags.all, 'list', filters],
      detail: (id: string) => [...queryKeys.admin.featureFlags.all, 'detail', id],
    },
    gameContent: { /* ... */ },
    moderation: { /* ... */ },
    userEngagement: { /* ... */ },
    orgAnalytics: { /* ... */ },
    reports: { /* ... */ },
  },
};
```

### Context Hierarchy

```
<QueryClientProvider>
  <AuthProvider>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </AuthProvider>
</QueryClientProvider>
```

---

## 🎨 Styling & UI

### Technology Stack
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality component library
- **Lucide Icons** - Consistent icon system
- **CVA (Class Variance Authority)** - Type-safe component variants

### Design System

#### Color Palette
```typescript
// From Tailwind config
// Primary: Blue (brand color)
// Success: Green (positive actions)
// Warning: Amber (caution)
// Error: Red (destructive)
// Muted: Gray (secondary)
```

#### Component Variants
```typescript
// Example: Button variants
<Button variant="default" size="md">Default</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<Button variant="outline" size="lg">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

#### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar collapses on mobile
- Touch-friendly button sizes (44px minimum)

---

## 🌍 Internationalization (i18n)

### Supported Languages
- **English** (en) - Default
- **French** (fr)
- **German** (de)
- **Spanish** (es)

### i18n File Structure
```
src/i18n/
├── i18n.ts                    # Configuration
├── locales/
│   ├── en.json               # ~2,000+ keys
│   ├── fr.json
│   ├── de.json
│   └── es.json
└── namespace/                # Organized by feature
    ├── admin/
    ├── games/
    ├── auth/
    └── common/
```

### Usage Pattern
```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return <button>{t('admin.buttons.save')}</button>;
}

// With default fallback
<span>{t('label.notFound', { defaultValue: 'Label not found' })}</span>

// With interpolation
<p>{t('greeting', { name: 'John' })}</p>
```

### TIER 1 Translation Keys (Sample)
```json
{
  "admin": {
    "featureFlags": {
      "title": "Feature Flags",
      "description": "Manage feature rollouts and A/B testing",
      "columns": {
        "key": "Flag Key",
        "name": "Name",
        "enabled": "Status",
        "rollout": "Rollout %"
      },
      "actions": {
        "create": "Create Flag",
        "edit": "Edit Flag",
        "delete": "Delete Flag",
        "test": "Test Flag"
      }
    }
  }
}
```

---

## ✅ Testing

### Testing Stack
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **Vitest UI** - Visual test runner

### Test Structure
```
tests/
├── unit/                      # Component logic
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/               # Component interaction
├── e2e/                       # Full user flows
└── setup.ts                   # Test environment
```

### Example Test
```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { DataTable } from '@/components/admin/DataTable';

describe('DataTable', () => {
  it('should display table with data', () => {
    const data = [{ id: '1', name: 'Test' }];
    render(<DataTable columns={[]} data={data} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle sort click', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(<DataTable columns={[{ key: 'name', sortable: true }]} data={[]} onSort={onSort} />);
    
    await user.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalled();
  });
});
```

### Running Tests
```bash
# Run all tests once
npm run test

# Watch mode with auto-rerun
npm run test:watch

# Run with coverage
npm run test -- --coverage

# Run specific file
npm run test -- DataTable.test.tsx
```

---

## 🚀 Development Workflow

### Setup & Installation

#### Prerequisites
- Node.js 18+ or Bun 1.0+
- npm, yarn, or Bun package manager

#### Installation Steps
```bash
# Clone repository
git clone <repo-url>
cd flowkyn_frontend

# Install dependencies
npm install
# or
bun install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your API URL and settings
```

#### Environment Variables
```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Flowkyn
VITE_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

### Development Server

#### Start Development Server
```bash
npm run dev
# Server runs at http://localhost:5173
```

#### Features
- Hot Module Replacement (HMR)
- Source maps for debugging
- Auto-reload on file changes

### Building for Production

#### Build Command
```bash
npm run build
# Output in dist/ folder
```

#### Preview Production Build
```bash
npm run preview
# Test built version locally at http://localhost:4173
```

### Code Quality

#### Linting
```bash
npm run lint
# Fix auto-fixable issues
npm run lint -- --fix
```

#### Code Format
- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Pre-commit hooks (husky) for validation

---

## 🌐 Deployment

### Deployment Platforms

#### Vercel (Recommended for Next.js-style apps)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

Configuration in `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

#### Docker Deployment
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Environment Parity
- Staging: Pre-production testing
- Production: Live environment
- Development: Local development

### Performance Optimization

#### Bundle Analysis
```bash
npm run build -- --analyze
```

#### Code Splitting Strategy
- Lazy load TIER 1 admin pages
- Route-based code splitting
- Dynamic imports for heavy components

#### Caching Strategy
- Service Worker for offline support
- Query result caching (React Query)
- Browser cache headers

### Monitoring & Logging

#### Error Tracking
- Sentry integration (optional)
- Error boundaries for React errors
- Console error capturing

#### Performance Monitoring
- Web Vitals tracking
- Page load metrics
- API response times

---

## 📦 Version Info

**Current Version:** 1.0.0  
**Last Updated:** March 21, 2026  
**Node Version:** 18.0.0+  
**Package Manager:** npm / yarn / bun

### Release Notes
- ✅ TIER 1 Features Implementation Complete
- ✅ 6 API client modules
- ✅ 50+ custom React Query hooks
- ✅ 6 admin page components
- ✅ 6 shared UI components
- ✅ Full internationalization support
- ✅ Dark mode support

---

## 📞 Support & Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [React Query Docs](https://tanstack.com/query/latest)
- [i18next Documentation](https://www.i18next.com)

### Developer Tools
- [React DevTools Browser Extension](https://react-devtools-tutorial.vercel.app/)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Vitest UI](https://vitest.dev/guide/ui.html)

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run tests once
npm run test:watch       # Watch mode

# Code Quality
npm run lint             # Lint code
npm run lint -- --fix    # Fix lint issues

# Type Checking
npx tsc --noEmit         # Check TypeScript errors
```

---

## 📋 File Size & Statistics

| Category | Count | Lines |
|----------|-------|-------|
| API Clients | 6 | 400+ |
| Custom Hooks | 50+ | 300+ |
| Page Components | 6 | 1,300+ |
| Shared Components | 6 | 695 |
| UI Primitives | 35+ | 2,000+ |
| Types & Constants | 15+ | 500+ |
| **Total** | **120+** | **5,000+** |

---

## 📄 License

This project is proprietary and confidential.

---

**Last Updated:** March 21, 2026  
**Maintained by:** Development Team  
**Status:** Active Development
