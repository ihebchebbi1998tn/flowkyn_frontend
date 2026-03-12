/**
 * Authentication Context — wired to real backend API.
 * Handles login, register, logout, session restore with JWT refresh.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { authApi } from '../api/auth';
import { trackEvent, TRACK } from '@/hooks/useTracker';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; lang?: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from stored JWT
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.me()
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Don't set isLoading here — it causes the entire app to re-render and "reload"
    // The Login page manages its own isLoading state
    try {
      const result = await authApi.login(email, password);
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      if (result.user) {
        setUser(result.user);
      } else {
        const userData = await authApi.me();
        setUser(userData);
      }
    } catch (err) {
      // Re-throw so Login.tsx can handle the error UI
      throw err;
    }
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name: string; lang?: string }) => {
    try {
      await authApi.register(data);
      // Backend sends verification email — no auto-login
    } catch (err) {
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    trackEvent(TRACK.LOGOUT, {});
    authApi.logout().catch(() => { }); // best-effort server call
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
