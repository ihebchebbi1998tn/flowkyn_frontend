/**
 * @fileoverview Admin domain routes — admin.flowkyn.com ONLY.
 */

import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ADMIN_ROUTES } from './constants/routes';
import { AdminLayout } from './components/AdminLayout';
import { AdminGuard } from './guards/AdminGuard';

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminOrganizations = lazy(() => import('./pages/AdminOrganizations'));
const AdminGames = lazy(() => import('./pages/AdminGames'));
const AdminContacts = lazy(() => import('./pages/AdminContacts'));
const AdminAuditLogs = lazy(() => import('./pages/AdminAuditLogs'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminBugReportsPage = lazy(() => import('./pages/AdminBugReportsPage'));
const AdminEarlyAccess = lazy(() => import('./pages/AdminEarlyAccess'));
const AdminActivityFeedbacksPage = lazy(() => import('./pages/AdminActivityFeedbacksPage'));

export const adminRoutes = (
  <>
    <Route path="/login" element={<AdminLogin />} />
    <Route
      element={
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      }
    >
      <Route index element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />} />
      <Route path={ADMIN_ROUTES.DASHBOARD} element={<AdminDashboard />} />
      <Route path={ADMIN_ROUTES.USERS} element={<AdminUsers />} />
      <Route path={ADMIN_ROUTES.ORGANIZATIONS} element={<AdminOrganizations />} />
      <Route path={ADMIN_ROUTES.GAMES} element={<AdminGames />} />
      <Route path={ADMIN_ROUTES.CONTACTS} element={<AdminContacts />} />
      <Route path={ADMIN_ROUTES.EARLY_ACCESS} element={<AdminEarlyAccess />} />
      <Route path={ADMIN_ROUTES.AUDIT_LOGS} element={<AdminAuditLogs />} />
      <Route path={ADMIN_ROUTES.BUG_REPORTS} element={<AdminBugReportsPage />} />
      <Route path={ADMIN_ROUTES.FEEDBACKS} element={<AdminActivityFeedbacksPage />} />
      <Route path={ADMIN_ROUTES.SETTINGS} element={<AdminSettings />} />
    </Route>
  </>
);
