/**
 * Notification Context — wired to real backend API + socket for real-time updates.
 * Subscribes to the /notifications WebSocket namespace for live push notifications.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification, PaginatedResponse } from '@/types';
import { notificationsApi } from '@/features/app/api/notifications';
import { useAuth } from '@/features/app/context/AuthContext';
import { useNotificationsSocket } from '@/hooks/useSocket';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Safely check auth — may not have AuthProvider in admin-only mode
  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
  } catch {
    // Not inside AuthProvider (e.g., admin-only mode) — stay unauthenticated
  }

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await notificationsApi.list(1, 50);
      setNotifications(result.data);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount & when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
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
    } catch {
      // Revert on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: null } : n));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || now })));
    // Mark each unread notification as read on the server
    for (const id of unreadIds) {
      notificationsApi.markAsRead(id).catch(() => {});
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, markAsRead, markAllRead, refetch: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
