import { lazy } from 'react';
import { Route } from 'react-router-dom';

const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));

export const templatesRoutes = (
  <Route path="/templates" element={<TemplatesPage />} />
);
