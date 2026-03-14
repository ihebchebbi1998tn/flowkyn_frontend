/**
 * Notification Context — wired to real backend API + socket for real-time updates.
 * Subscribes to the /notifications WebSocket namespace for live push notifications.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Notification } from '@/types';
import { notificationsApi } from '@/features/app/api/notifications';
import { useAuth } from '@/features/app/context/AuthContext';
import { useNotificationsSocket } from '@/hooks/useSocket';
import { useApiError } from '@/hooks/useApiError';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Module-level state to survive component unmounts (prevents loops during remount cycles)
let lastFetchTime = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useApiError();
  const isLoadingRef = useRef(false);

  // useAuth() must be called unconditionally (Rules of Hooks).
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const fetchNotifications = useCallback(async (forced = false) => {
    // Basic guards
    if (!isAuthenticated || isLoadingRef.current) return;
    
    // Don't poll while in onboarding (reduces noise during setup)
    if (window.location.pathname.includes('/onboarding')) return;

    // Throttle: don't fetch more than once every 2 seconds unless forced
    const now = Date.now();
    if (!forced && now - lastFetchTime < 2000) return;
    lastFetchTime = now;

    setIsLoading(true);
    isLoadingRef.current = true;
    try {
      const result = await notificationsApi.list(1, 50);
      setNotifications(result.data);
    } catch (err) {
      showError(err, 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [isAuthenticated, showError]);

  // Fetch on mount & when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      lastFetchTime = 0;
    }
  }, [isAuthenticated, fetchNotifications]);

  // ─── Real-time: subscribe to /notifications WebSocket ───
  const notifSocket = useNotificationsSocket({
    autoConnect: isAuthenticated,
  });

  useEffect(() => {
    if (!notifSocket.isConnected) return;

    // Handle new notification pushed from server
    const handleNewNotification = (data: { id: string; type: string; data: any; created_at: string }) => {
      const newNotif: Notification = {
        id: data.id,
        type: data.type,
        data: data.data,
        created_at: data.created_at,
        read_at: null,
        user_id: '',
      };
      setNotifications(prev => {
        // Deduplicate
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    };

    const unsub = notifSocket.on('notification:new', handleNewNotification);
    return unsub;
  }, [notifSocket.isConnected]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      // Revert on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: null } : n));
      showError(err, 'Failed to mark notification as read');
    }
  }, [showError]);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || now })));
    // Mark each unread notification as read on the server
    for (const id of unreadIds) {
      notificationsApi.markAsRead(id).catch(() => {});
    }
  }, [notifications.length]); // Only depend on length to avoid inner loops if content changes but not count

  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead,
    refetch: fetchNotifications
  }), [notifications, unreadCount, isLoading, markAsRead, markAllRead, fetchNotifications]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
