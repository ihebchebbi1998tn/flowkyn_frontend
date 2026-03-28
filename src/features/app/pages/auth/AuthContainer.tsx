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
import { LanguageSelector } from '@/components/common';

export default function AuthContainer() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>('login');

  // Determine initial view from URL params or reset token
  useEffect(() => {
    const token = searchParams.get('token');
    const view = (searchParams.get('view') as AuthView | null);

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

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const switchView = (view: AuthView) => {
    setCurrentView(view);
    if (view === 'reset') {
      const token = searchParams.get('token');
      if (token) {
        navigate(`?view=reset&token=${token}`, { replace: true });
      }
    } else {
      navigate(`?view=${view}`, { replace: true });
    }
  };

  let brandingMode: 'login' | 'register' | 'forgot' | 'reset' = 'login';
  if (currentView === 'register') brandingMode = 'register';
  else if (currentView === 'forgot') brandingMode = 'forgot';
  else if (currentView === 'reset') brandingMode = 'reset';

  return (
    <AuthSwitchContext.Provider value={{ currentView, switchView }}>
      <div className="min-h-screen flex animate-in fade-in duration-500 relative">
        <AuthBrandingPanel mode={brandingMode} />

        {/* ── Form side ── */}
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
          {/* Subtle background texture */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Top bar with language */}
          <div className="relative z-10 flex items-center justify-end p-4">
            <LanguageSelector align="end" />
          </div>

          {/* Centered form area */}
          <div className="flex-1 flex items-center justify-center px-6 pb-8 relative z-10">
            <motion.div
              className="w-full max-w-[400px]"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatePresence mode="wait">
                {currentView === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <Login />
                  </motion.div>
                )}

                {currentView === 'register' && (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <Register />
                  </motion.div>
                )}

                {currentView === 'forgot' && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <ForgotPassword />
                  </motion.div>
                )}

                {currentView === 'reset' && (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <ResetPassword />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Bottom trust line */}
          <div className="relative z-10 flex items-center justify-center gap-3 pb-5 text-[10px] text-muted-foreground/40">
            <span>🔒 Encrypted</span>
            <span>·</span>
            <span>No credit card required</span>
            <span>·</span>
            <span>Free to start</span>
          </div>
        </div>
      </div>
    </AuthSwitchContext.Provider>
  );
}