/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                  ADMIN AUTHENTICATION CONTEXT                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ STATUS: WIRED TO REAL BACKEND (api.flowkyn.com)                            │
 * │                                                                            │
 * │ This context handles admin-specific authentication.                        │
 * │ It uses separate localStorage keys (admin_access_token, admin_refresh_token)│
 * │ so admin sessions don't conflict with user-facing app sessions.            │
 * │                                                                            │
 * │ Default admin credentials (seeded by backend on startup):                  │
 * │   Email:    support@flowkyn.com                                            │
 * │   Password: Flowkyn2026                                                    │
 * │                                                                            │
 * │ BACKEND ENDPOINTS:                                                         │
 * │   POST /v1/auth/login   → { access_token, refresh_token, user }            │
 * │   GET  /v1/users/me     → User object                                     │
 * │   POST /v1/auth/logout  → { message }                                      │
 * │   POST /v1/auth/refresh → { access_token, refresh_token }                  │
 * │                                                                            │
 * │ Admin access is enforced server-side via requireSuperAdmin middleware.      │
 * │ Only emails in SUPER_ADMIN_EMAILS (+ support@flowkyn.com) can access       │
 * │ /v1/admin/* endpoints.                                                     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { adminClient } from '@/api/adminClient';

interface AdminAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore admin session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      adminClient.get<User>('/users/me')
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await adminClient.post<{
        access_token: string;
        refresh_token: string;
        user?: User;
      }>('/auth/login', { email, password });

      localStorage.setItem('admin_access_token', result.access_token);
      localStorage.setItem('admin_refresh_token', result.refresh_token);

      if (result.user) {
        setUser(result.user);
      } else {
        const userData = await adminClient.get<User>('/users/me');
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Best-effort server logout — send refresh token for single-session invalidation
    const refreshToken = localStorage.getItem('admin_refresh_token');
    adminClient.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : undefined).catch(() => {});
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    setUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, setUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
