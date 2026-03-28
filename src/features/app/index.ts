/**
 * @fileoverview App domain barrel — all app-specific exports.
 *
 * This domain is fully self-contained and can be extracted into
 * a standalone application if needed.
 *
 * Structure:
 *   app/
 *     api/         — App API client & endpoint modules
 *     components/  — App-specific UI components (activities, chat, game, dashboard)
 *     constants/   — ROUTES
 *     context/     — AuthContext, NotificationContext
 *     data/        — Static data (activities catalog)
 *     guards/      — AuthGuard
 *     layouts/     — DashboardLayout, FocusedLayout, Topbar, AppSidebar
 *     pages/       — App page components
 *     routes.tsx   — App route definitions
 */
export { appRoutes } from './routes';
export { ROUTES } from './constants/routes';
export { AuthProvider, useAuth } from './context/AuthContext';
export { NotificationProvider, useNotifications } from './context/NotificationContext';
export { AuthGuard } from './guards/AuthGuard';
export { DashboardLayout, FocusedLayout, AppSidebar, Topbar } from './layouts';
