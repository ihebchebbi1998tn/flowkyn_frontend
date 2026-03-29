import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps admin routes — redirects unauthenticated users to /login.
 * Uses the admin-specific auth context (AdminAuthContext) which authenticates
 * against the real backend at api.flowkyn.com.
 * 
 * Server-side enforcement: All /v1/admin/* endpoints also require
 * the requireSuperAdmin middleware, so even if someone bypasses this guard,
 * they can't access admin data without a valid super-admin JWT.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
