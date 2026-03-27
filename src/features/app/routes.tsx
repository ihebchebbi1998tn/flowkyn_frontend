/**
 * @fileoverview App domain routes — app.flowkyn.com ONLY.
 * Each route group is wrapped in a RouteErrorBoundary for isolation.
 */

import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { DashboardLayout } from './layouts/DashboardLayout';
import { FocusedLayout } from './layouts/FocusedLayout';
import { AuthGuard } from './guards/AuthGuard';
import { RouteErrorBoundary } from '@/components/guards/ErrorBoundary';

/* ─── Auth Pages ─── */
const AuthContainer = lazy(() => import('./pages/auth/AuthContainer'));
const OTPVerify = lazy(() => import('./pages/auth/OTPVerify'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

/* ─── Invitations ─── */
const AcceptInvitation = lazy(() => import('./pages/invitations/AcceptInvitation'));

/* ─── Onboarding ─── */
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding'));

/* ─── Dashboard / Core ─── */
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Profile = lazy(() => import('./pages/users/Profile'));
const UserList = lazy(() => import('./pages/users/UserList'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
// AnalyticsDashboard merged into Dashboard

/* ─── Organizations ─── */
const OrgDetail = lazy(() => import('./pages/organizations/OrgDetail'));

/* ─── Events ─── */
const EventList = lazy(() => import('./pages/events/EventList'));
const EventDetail = lazy(() => import('./pages/events/EventDetail'));
const EventForm = lazy(() => import('./pages/events/EventForm'));
const EventLobby = lazy(() => import('./pages/events/EventLobby'));

/* ─── Games / Play ─── */
const GameList = lazy(() => import('./pages/games/GameList'));
const GamePlay = lazy(() => import('./pages/play/GamePlay'));
const SessionDetailsPage = lazy(() => import('./pages/sessions/SessionDetailsPage'));

/* ─── Dev / Testing ─── */
const IdeaChatPage = lazy(() => import('./pages/ai/IdeaChatPage'));

/* ─── Activities ─── */
const ActivityDetail = lazy(() => import('./pages/activities/ActivityDetail'));
const LaunchActivity = lazy(() => import('./pages/activities/LaunchActivity'));

/* ─── Support & Bug Reports ─── */
const SupportPage = lazy(() => import('./pages/support/SupportPage'));

export const appRoutes = (
  <>
    {/* ─── Auth pages (public, no guard) — unified in AuthContainer ─── */}
    <Route path={ROUTES.LOGIN} element={<RouteErrorBoundary section="Auth"><AuthContainer /></RouteErrorBoundary>} />
    <Route path={ROUTES.REGISTER} element={<RouteErrorBoundary section="Auth"><AuthContainer /></RouteErrorBoundary>} />
    <Route path={ROUTES.FORGOT_PASSWORD} element={<RouteErrorBoundary section="Auth"><AuthContainer /></RouteErrorBoundary>} />
    <Route path={ROUTES.RESET_PASSWORD} element={<RouteErrorBoundary section="Auth"><AuthContainer /></RouteErrorBoundary>} />
    <Route path={ROUTES.VERIFY_OTP} element={<RouteErrorBoundary section="Verification"><OTPVerify /></RouteErrorBoundary>} />
    <Route path="/verify" element={<RouteErrorBoundary section="Email Verification"><VerifyEmail /></RouteErrorBoundary>} />

    {/* ─── Invitations ─── */}
    <Route path={ROUTES.INVITE()} element={<RouteErrorBoundary section="Invitation"><AcceptInvitation /></RouteErrorBoundary>} />

    {/* ─── Onboarding (protected but no dashboard layout) ─── */}
    <Route path={ROUTES.ONBOARDING} element={<AuthGuard><RouteErrorBoundary section="Onboarding"><Onboarding /></RouteErrorBoundary></AuthGuard>} />

    {/* ─── Dashboard Layout (sidebar + topbar) ─── */}
    <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path={ROUTES.DASHBOARD} element={<RouteErrorBoundary section="Dashboard"><Dashboard /></RouteErrorBoundary>} />
      <Route path={ROUTES.PROFILE} element={<RouteErrorBoundary section="Profile"><Profile /></RouteErrorBoundary>} />
      <Route path={ROUTES.USERS} element={<RouteErrorBoundary section="Users"><UserList /></RouteErrorBoundary>} />
      <Route path={ROUTES.SETTINGS} element={<RouteErrorBoundary section="Settings"><SettingsPage /></RouteErrorBoundary>} />
      <Route path={ROUTES.NOTIFICATIONS} element={<RouteErrorBoundary section="Notifications"><NotificationsPage /></RouteErrorBoundary>} />
      {/* Analytics merged into Dashboard — keep route as redirect */}
      <Route path={ROUTES.ANALYTICS} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      <Route path={ROUTES.ORGANIZATIONS} element={<RouteErrorBoundary section="Organization"><OrgDetail /></RouteErrorBoundary>} />

      <Route path={ROUTES.EVENTS} element={<RouteErrorBoundary section="Events"><EventList /></RouteErrorBoundary>} />
      <Route path={ROUTES.EVENT_NEW} element={<RouteErrorBoundary section="New Event"><EventForm /></RouteErrorBoundary>} />
      <Route path={ROUTES.EVENT_DETAIL()} element={<RouteErrorBoundary section="Event Detail"><EventDetail /></RouteErrorBoundary>} />
      <Route path={ROUTES.EVENT_EDIT()} element={<RouteErrorBoundary section="Edit Event"><EventForm /></RouteErrorBoundary>} />

      <Route path={ROUTES.GAMES} element={<RouteErrorBoundary section="Activities"><GameList /></RouteErrorBoundary>} />
      <Route path={ROUTES.SESSION_DETAILS()} element={<RouteErrorBoundary section="Session Details"><SessionDetailsPage /></RouteErrorBoundary>} />

      <Route path={ROUTES.ACTIVITY_DETAIL()} element={<RouteErrorBoundary section="Activity"><ActivityDetail /></RouteErrorBoundary>} />
      <Route path={ROUTES.ACTIVITY_LAUNCH()} element={<RouteErrorBoundary section="Launch Activity"><LaunchActivity /></RouteErrorBoundary>} />

      {/* Dev / Testing */}
      <Route path={ROUTES.AI_IDEA_CHAT} element={<RouteErrorBoundary section="AI Idea Chat"><IdeaChatPage /></RouteErrorBoundary>} />

      {/* Support & Bug Reports */}
      <Route path={ROUTES.SUPPORT_REPORT} element={<RouteErrorBoundary section="Support"><SupportPage /></RouteErrorBoundary>} />
      <Route path={ROUTES.SUPPORT_REPORTS} element={<RouteErrorBoundary section="Support"><SupportPage /></RouteErrorBoundary>} />
    </Route>

    {/* ─── Focused Layout (no sidebar — immersive game experience) ─── */}
    <Route element={<FocusedLayout />}>
      <Route path={ROUTES.EVENT_LOBBY()} element={<RouteErrorBoundary section="Event Lobby"><EventLobby /></RouteErrorBoundary>} />
      <Route path={ROUTES.PLAY()} element={<RouteErrorBoundary section="Game"><GamePlay /></RouteErrorBoundary>} />
    </Route>
  </>
);
