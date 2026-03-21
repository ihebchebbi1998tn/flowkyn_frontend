/**
 * @fileoverview Tests for SessionDetailsPanel Component
 * 
 * Tests error handling, loading states, and session data display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionDetailsPanel } from './SessionDetailsPanel';
import * as useSessionsQueries from '@/hooks/queries/useSessionsQueries';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-testid="button">
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/components/loading/Skeletons', () => ({
  DashboardSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

// Mock child components
vi.mock('.', () => ({
  SessionParticipants: () => <div data-testid="participants">Participants</div>,
  SessionMessages: () => <div data-testid="messages">Messages</div>,
  SessionActions: () => <div data-testid="actions">Actions</div>,
  SessionTimeline: () => <div data-testid="timeline">Timeline</div>,
}));

describe('SessionDetailsPanel', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderComponent = (sessionId: string | null, enabled = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SessionDetailsPanel sessionId={sessionId} enabled={enabled} />
      </QueryClientProvider>
    );
  };

  describe('Loading State', () => {
    it('should show skeleton loader while fetching', () => {
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        status: 'pending',
      } as any);

      renderComponent('test-session-id');

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show 404 error message when session not found', async () => {
      const error = new Error('Session not found (404)');
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        status: 'error',
      } as any);

      renderComponent('invalid-session-id');

      await waitFor(() => {
        expect(screen.getByText(/Session not found/)).toBeInTheDocument();
      });
    });

    it('should show generic error message for non-404 errors', async () => {
      const error = new Error('Network error');
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        status: 'error',
      } as any);

      renderComponent('test-session-id');

      await waitFor(() => {
        expect(screen.getByText(/Failed to load session/)).toBeInTheDocument();
      });
    });

    it('should show error details in debug panel', async () => {
      const errorMessage = 'Database connection failed';
      const error = new Error(errorMessage);
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        status: 'error',
      } as any);

      renderComponent('test-session-id');

      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      const error = new Error('Network error');
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
        status: 'error',
      } as any);

      renderComponent('test-session-id');

      await waitFor(() => {
        const retryButtons = screen.getAllByTestId('button');
        expect(retryButtons.some(b => b.textContent?.includes('Retry'))).toBe(true);
      });
    });
  });

  describe('Empty State', () => {
    it('should show warning when no session data but no error', () => {
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        status: 'success',
      } as any);

      renderComponent('test-session-id');

      expect(screen.getByText(/No session data available/)).toBeInTheDocument();
    });
  });

  describe('Disabled Query', () => {
    it('should not fetch when enabled is false', () => {
      const spy = vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'pending',
      } as any);

      renderComponent('test-session-id', false);

      expect(spy).toHaveBeenCalledWith('test-session-id', false);
    });

    it('should not fetch when sessionId is null', () => {
      const spy = vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        status: 'pending',
      } as any);

      renderComponent(null);

      expect(spy).toHaveBeenCalledWith(null, true);
    });
  });

  describe('Successful Data Display', () => {
    const mockSessionData = {
      id: 'session-1',
      event_id: 'event-1',
      event_title: 'Team Building Event',
      game_type_id: 'game-1',
      game_name: 'Coffee Roulette',
      game_key: 'coffee_roulette',
      status: 'active' as const,
      current_round: 2,
      total_rounds: 5,
      game_duration_minutes: 30,
      started_at: '2026-03-21T10:00:00Z',
      ended_at: null,
      session_deadline_at: '2026-03-21T10:30:00Z',
      total_participants: 10,
      active_participants: 8,
      completed_participants: 2,
      total_messages: 45,
      total_actions: 32,
      total_rounds_completed: 1,
      created_at: '2026-03-21T09:55:00Z',
      updated_at: '2026-03-21T10:15:00Z',
      participants: [],
      messages: [],
      actions: [],
      timeline: [],
    };

    it('should display session details when data loads successfully', async () => {
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: mockSessionData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any);

      vi.spyOn(useSessionsQueries, 'useCloseSession').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.spyOn(useSessionsQueries, 'useDeleteSession').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.spyOn(useSessionsQueries, 'useExportSessionData').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      renderComponent('session-1');

      await waitFor(() => {
        expect(screen.getByText('Team Building Event')).toBeInTheDocument();
      });
    });

    it('should render tabs for different views', async () => {
      vi.spyOn(useSessionsQueries, 'useSessionDetails').mockReturnValue({
        data: mockSessionData,
        isLoading: false,
        error: null,
        status: 'success',
      } as any);

      vi.spyOn(useSessionsQueries, 'useCloseSession').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.spyOn(useSessionsQueries, 'useDeleteSession').mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      vi.spyOn(useSessionsQueries, 'useExportSessionData').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      } as any);

      renderComponent('session-1');

      await waitFor(() => {
        expect(screen.getByTestId('tabs')).toBeInTheDocument();
      });
    });
  });
});
