import { Outlet } from 'react-router-dom';
import ComingSoon from '../pages/ComingSoon';

/**
 * Guard that protects the landing page and routes with a "Coming Soon" screen.
 * Access is granted if 'flowkyn_early_access' is set to 'granted' in localStorage.
 */
export function EarlyAccessGuard() {
  const isAccessGranted = localStorage.getItem('flowkyn_early_access') === 'granted';

  if (!isAccessGranted) {
    return <ComingSoon />;
  }

  return <Outlet />;
}
