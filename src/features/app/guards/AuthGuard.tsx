import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { useTranslation } from 'react-i18next';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected routes — redirects unauthenticated users to login
 * and users who haven't completed onboarding to the onboarding flow.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('common.loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed (unless already on onboarding page)
  if (user && !user.onboarding_completed && location.pathname !== ROUTES.ONBOARDING) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  return <>{children}</>;
}
