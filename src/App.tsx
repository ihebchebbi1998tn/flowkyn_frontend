import { Suspense, lazy } from 'react';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/features/app/context/AuthContext';
import { AdminAuthProvider } from '@/features/admin/context/AdminAuthContext';
import { NotificationProvider } from '@/features/app/context/NotificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ErrorBoundary } from '@/components/guards/ErrorBoundary';
import { AuthPageSkeleton } from '@/components/loading/PageSkeleton';
import { DeploymentNotificationSystem } from '@/components/deployment/DeploymentNotificationSystem';
import { landingRoutes, appRoutes, adminRoutes, testRoutes, templatesRoutes } from '@/routes';
import { detectAppMode, isDevMode } from '@/lib/appMode';
import '@/i18n';

const NotFound = lazy(() => import('@/pages/NotFound'));

/* ─── Query client (stable singleton) ─── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Renders ONLY the correct set of routes based on the detected app mode.
 */
function AppRoutes() {
  const mode = detectAppMode();
  const dev = isDevMode();

  return (
    <Routes>
      {(dev || mode === 'landing') && landingRoutes}
      {(dev || mode === 'app') && appRoutes}
      {(dev || mode === 'admin') && adminRoutes}
      {(dev || mode === 'tests') && testRoutes}
      {(dev || mode === 'templates') && templatesRoutes}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/**
 * Wraps children with the appropriate auth provider(s).
 */
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const mode = detectAppMode();
  const dev = isDevMode();

  if (dev) {
    return (
      <AuthProvider>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </AuthProvider>
    );
  }

  if (mode === 'admin') {
    // Admin pages may reuse shared components that call `useAuth()`.
    // Keeping `AuthProvider` mounted avoids runtime crashes even when the admin user
    // is authenticated via `AdminAuthProvider`.
    return (
      <AuthProvider>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </AuthProvider>
    );
  }

  return <AuthProvider>{children}</AuthProvider>;
}

/* ─── App ─── */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthWrapper>
        <Suspense fallback={<AuthPageSkeleton />}>
          <Sonner />
          <NotificationProvider>
            <TooltipProvider>
              <DeploymentNotificationSystem />
              <BrowserRouter>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </NotificationProvider>
        </Suspense>
      </AuthWrapper>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
