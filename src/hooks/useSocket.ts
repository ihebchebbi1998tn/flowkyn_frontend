/**
 * Socket.io client hook — connects to backend namespaces with JWT auth.
 * Uses refs for callbacks to prevent infinite reconnect loops.
 */
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api.flowkyn.com';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface UseSocketOptions {
  namespace: string;
  autoConnect?: boolean;
  eventId?: string; // For event-specific guest token lookup
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (err: { message: string; code?: string }) => void;
}

export function useSocket({ namespace, autoConnect = true, eventId, onConnect, onDisconnect, onError }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // Store callbacks in refs to avoid reconnect loops
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  onErrorRef.current = onError;

  const connect = useCallback(() => {
    // Support both guest tokens (event-specific) and regular access tokens
    const guestToken = eventId ? localStorage.getItem(`guest_token_${eventId}`) : localStorage.getItem('guest_token');
    const token = guestToken || localStorage.getItem('access_token');
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    setStatus(prev => (prev === 'disconnected' ? 'connecting' : 'reconnecting'));

    console.log('[useSocket] connect called', { namespace, eventId, hasGuestToken: !!guestToken, hasAccessToken: !!localStorage.getItem('access_token') });

    const socket = io(`${SOCKET_URL}${namespace}`, {
      auth: (cb) => {
        // Fetch fresh token at the exact moment of connection/reconnection
        const freshGuest = eventId ? localStorage.getItem(`guest_token_${eventId}`) : localStorage.getItem('guest_token');
        const freshToken = freshGuest || localStorage.getItem('access_token');
        cb({ token: freshToken });
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      console.log('[useSocket] connected', { namespace, eventId, socketId: socket.id });
      setIsConnected(true);
      setStatus('connected');
      onConnectRef.current?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('[useSocket] disconnected', { namespace, eventId, reason });
      setIsConnected(false);
      // Socket.io will attempt to reconnect automatically unless we explicitly called disconnect,
      // but from the client's perspective we can treat this as either reconnecting or disconnected.
      // We'll optimistically assume reconnection will be attempted.
      setStatus('reconnecting');
      onDisconnectRef.current?.(reason);
    });

    socket.io.on('reconnect_attempt', () => {
      console.log('[useSocket] reconnect_attempt', { namespace, eventId });
      setStatus('reconnecting');
    });

    socket.io.on('reconnect_error', () => {
      console.warn('[useSocket] reconnect_error', { namespace, eventId });
      setStatus('reconnecting');
    });

    socket.io.on('reconnect_failed', () => {
      console.error('[useSocket] reconnect_failed', { namespace, eventId });
      setStatus('disconnected');
    });

    socket.on('error', (data: { message: string; code?: string }) => {
      console.error('[useSocket] socket error', { namespace, eventId, error: data });
      onErrorRef.current?.(data);
    });

    socket.on('connect_error', (err) => {
      console.warn(`[Socket ${namespace}] Connection error:`, err.message, { eventId });
      setIsConnected(false);
      setStatus('reconnecting');
      onErrorRef.current?.({ message: err.message || 'Socket connection error', code: 'CONNECT_ERROR' });
      if (err.message.includes('Authentication') || err.message.includes('token')) {
        socket.disconnect();
        setStatus('disconnected');
      }
    });

    socketRef.current = socket;
  }, [namespace, eventId]); // Include eventId as dependency for event-specific tokens

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
    setStatus('disconnected');
  }, []);

  const emit = useCallback(<T = any>(event: string, data?: any): Promise<T | void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      socketRef.current.emit(event, data, (response: any) => {
        if (response?.ok === false) {
          reject(new Error(response.error || 'Socket operation failed'));
        } else {
          resolve(response?.data ?? response);
        }
      });
    });
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    // Capture the ref so cleanup always removes from whichever socket instance
    // is current at teardown time (handles reconnects correctly).
    const socketRefForCleanup = socketRef;
    return () => {
      socketRefForCleanup.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.removeAllListeners(event);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, connect]);

  return useMemo(
    () => ({ socket: socketRef.current, isConnected, status, connect, disconnect, emit, on, off }),
    [isConnected, status, connect, disconnect, emit, on, off]
  );
}

// ─── Convenience hooks for each namespace ───

export function useEventsSocket(options?: Omit<UseSocketOptions, 'namespace'>) {
  return useSocket({ namespace: '/events', ...options });
}

export function useGamesSocket(options?: Omit<UseSocketOptions, 'namespace'>) {
  return useSocket({ namespace: '/games', ...options });
}

export function useNotificationsSocket(options?: Omit<UseSocketOptions, 'namespace'>) {
  return useSocket({ namespace: '/notifications', ...options });
}
