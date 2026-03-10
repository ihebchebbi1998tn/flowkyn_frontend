/**
 * @fileoverview Admin domain barrel — all admin-specific exports.
 *
 * This domain is fully self-contained and can be extracted into
 * a standalone application if needed.
 *
 * Structure:
 *   admin/
 *     api/         — Admin API client & endpoints
 *     components/  — AdminLayout
 *     constants/   — ADMIN_ROUTES
 *     context/     — AdminAuthContext
 *     guards/      — AdminGuard
 *     pages/       — Admin page components
 *     routes.tsx   — Admin route definitions
 */
export { adminRoutes } from './routes';
export { ADMIN_ROUTES } from './constants/routes';
export { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
export { AdminGuard } from './guards/AdminGuard';
export { AdminLayout } from './components/AdminLayout';
