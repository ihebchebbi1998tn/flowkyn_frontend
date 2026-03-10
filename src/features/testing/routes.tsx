/**
 * @fileoverview Test domain routes — tests.flowkyn.com ONLY.
 */

import { lazy } from 'react';
import { Route } from 'react-router-dom';

const UITests = lazy(() => import('./pages/UITests'));

export const testRoutes = (
  <>
    <Route path="/" element={<UITests />} />
    <Route path="/ui-tests" element={<UITests />} />
  </>
);
