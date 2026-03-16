/**
 * @fileoverview Route barrel — exports domain-isolated route sets.
 * Each domain feature owns its own routes.
 */
export { landingRoutes } from '@/features/landing/routes';
export { appRoutes } from '@/features/app/routes';
export { adminRoutes } from '@/features/admin/routes';
export { testRoutes } from '@/features/testing/routes';
export { templatesRoutes } from '@/features/templates/routes';
