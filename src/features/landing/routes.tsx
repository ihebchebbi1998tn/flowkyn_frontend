/**
 * @fileoverview Landing domain routes — flowkyn.com ONLY.
 */

import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '@/features/app/constants/routes';
import { EarlyAccessGuard } from './components/EarlyAccessGuard';

const Landing = lazy(() => import('./pages/Landing'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const SecurityPage = lazy(() => import('./pages/Security'));

export const landingRoutes = (
  <Route element={<EarlyAccessGuard />}>
    <Route path={ROUTES.HOME} element={<Landing />} />
    <Route path={ROUTES.ABOUT} element={<About />} />
    <Route path={ROUTES.CONTACT} element={<Contact />} />
    <Route path={ROUTES.PRIVACY} element={<Privacy />} />
    <Route path={ROUTES.TERMS} element={<Terms />} />
    <Route path={ROUTES.SECURITY} element={<SecurityPage />} />
  </Route>
);
