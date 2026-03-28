import { Outlet } from 'react-router-dom';
import ComingSoon from '../pages/ComingSoon';

/**
 * Guard that protects the landing page and routes with a "Coming Soon" screen.
 * Access is granted for the current browser session only.
 */
export function EarlyAccessGuard() {
  const isAccessGranted = sessionStorage.getItem('flowkyn_early_access') === 'granted';

  if (!isAccessGranted) {
    return <ComingSoon />;
  }

  return <Outlet />;
}
