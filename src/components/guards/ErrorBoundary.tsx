import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Label shown in error UI to identify the section */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches rendering errors and displays a recovery UI.
 * Wrap around route-level components to prevent full-app crashes.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);

    // Auto-recover from known "stale chunk" deploy issues.
    // When a user has an old UI bundle loaded and the corresponding dynamic import chunk
    // was removed by the next deployment, we can auto-reload to fetch the fresh chunk graph.
    const msg = String(error?.message || error);
    const isChunkFetchFailure =
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /Loading chunk/i.test(msg) ||
      /ChunkLoadError/i.test(msg);

    if (!isChunkFetchFailure) return;

    // Prevent infinite reload loops for the same failing navigation.
    const cacheKey = 'flowkyn_auto_recover_chunk_fetch_failed';
    const alreadyRecovered = sessionStorage.getItem(cacheKey) === '1';
    if (alreadyRecovered) return;

    try {
      sessionStorage.setItem(cacheKey, '1');
    } catch {
      // ignore
    }

    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage('CLEAN_CACHE');
      }
    } catch {
      // ignore
    }

    // Small delay so the cache-clearing message is processed.
    setTimeout(() => window.location.reload(), 250);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center" role="alert" aria-live="assertive">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
            <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {this.props.section ? `Error in ${this.props.section}` : 'Something went wrong'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            An unexpected error occurred. Please try again or contact support if the issue persists.
          </p>
          {this.state.error && (
            <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4 max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex items-center gap-2">
            <Button onClick={this.handleReset} variant="outline" className="gap-2 text-sm">
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'} variant="ghost" className="gap-2 text-sm">
              <Home className="h-4 w-4" /> Go home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Route-level ErrorBoundary wrapper for use in route definitions.
 * Provides section-specific error messaging.
 */
export function RouteErrorBoundary({ children, section }: { children: ReactNode; section: string }) {
  return <ErrorBoundary section={section}>{children}</ErrorBoundary>;
}
