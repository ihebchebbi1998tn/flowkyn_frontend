/**
 * @fileoverview Unified Auth Container — seamless transitions between login, signup, forgot password, and reset password.
 * No page reloads, smooth animations with framer-motion.
 */

import React, { useState, useEffect, useContext, createContext } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthBrandingPanel } from '@/features/app/components/auth/AuthBrandingPanel';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

export type AuthView = 'login' | 'register' | 'forgot' | 'reset';

export interface AuthSwitchContextProps {
  currentView: AuthView;
  switchView: (view: AuthView) => void;
}

export const AuthSwitchContext = createContext<AuthSwitchContextProps | undefined>(undefined);

export const useAuthSwitch = () => {
  const context = useContext(AuthSwitchContext);
  if (!context) {
    throw new Error('useAuthSwitch must be used within AuthContainer');
  }
  return context;
};

export default function AuthContainer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<AuthView>('login');

  // Determine initial view from URL params or reset token
  useEffect(() => {
    const token = searchParams.get('token');
    const view = (searchParams.get('view') as AuthView) || 'login';

    if (token && location.pathname === '/reset-password') {
      setCurrentView('reset');
    } else if (location.pathname === '/forgot-password') {
      setCurrentView('forgot');
    } else if (location.pathname === '/register') {
      setCurrentView('register');
    } else {
      setCurrentView(view);
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
      <div className="min-h-screen flex">
        <AuthBrandingPanel mode={brandingMode} />

        <div className="flex-1 flex items-center justify-center bg-background p-6 overflow-hidden">
          <motion.div
            className="w-full max-w-[380px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {currentView === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Login />
                </motion.div>
              )}

              {currentView === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Register />
                </motion.div>
              )}

              {currentView === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ForgotPassword />
                </motion.div>
              )}

              {currentView === 'reset' && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
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
