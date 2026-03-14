import React, { createContext, useContext } from 'react';

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
