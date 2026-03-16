/**
 * @fileoverview Unified Auth Container — seamless transitions between login, signup, forgot password, and reset password.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthBrandingPanel } from '@/features/app/components/auth/AuthBrandingPanel';
import { useAuth } from '@/features/app/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { AuthSwitchContext, type AuthView } from './AuthSwitchContext';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import { LanguageSelector } from '@/components/common/LanguageSelector';

export default function AuthContainer() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>('login');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Determine initial view from URL params or reset token
  useEffect(() => {
    const token = searchParams.get('token');
    const view = (searchParams.get('view') as AuthView | null);

    // Prioritize explicit view query param if set
    if (view) {
      setCurrentView(view);
    } else if (token && location.pathname === '/reset-password') {
      setCurrentView('reset');
    } else if (location.pathname === '/forgot-password') {
      setCurrentView('forgot');
    } else if (location.pathname === '/register') {
      setCurrentView('register');
    } else {
      setCurrentView('login');
    }
  }, [searchParams, location.pathname]);

  const switchView = (view: AuthView) => {
    setCurrentView(view);
    // Update URL for deep linking/bookmarking
    if (view === 'reset') {
      const token = searchParams.get('token');
      if (token) {
        navigate(`?view=reset&token=${token}`, { replace: true });
      }
    } else {
      navigate(`?view=${view}`, { replace: true });
    }
  };

  // Determine branding panel mode
  let brandingMode: 'login' | 'register' | 'forgot' | 'reset' = 'login';
  if (currentView === 'register') brandingMode = 'register';
  else if (currentView === 'forgot') brandingMode = 'forgot';
  else if (currentView === 'reset') brandingMode = 'reset';

  return (
    <AuthSwitchContext.Provider value={{ currentView, switchView }}>
      <div className="min-h-screen flex animate-in fade-in duration-500 relative">
        <AuthBrandingPanel mode={brandingMode} />

        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector align="end" />
        </div>

        <div className="flex-1 flex items-center justify-center bg-background p-6 overflow-hidden">
          <motion.div
            className="w-full max-w-[380px]"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {currentView === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Login />
                </motion.div>
              )}

              {currentView === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Register />
                </motion.div>
              )}

              {currentView === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ForgotPassword />
                </motion.div>
              )}

              {currentView === 'reset' && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ResetPassword />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AuthSwitchContext.Provider>
  );
}
