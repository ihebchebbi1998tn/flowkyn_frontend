/**
 * @fileoverview React Error Boundary component for graceful error handling
 * Catches rendering errors in child components and displays a fallback UI
 */

import { Component, ReactNode } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // In production, users can end up with mismatched JS chunks after a deploy (service worker caching).
    // That can surface as ESM TDZ runtime errors like: "Cannot access 'B' before initialization".
    // Since this error is caught by the boundary, the global `window.error` handler in `main.tsx`
    // won't run—so we trigger cache/SW cleanup here as a recovery path.
    if (import.meta.env.PROD) {
      const msg = String((error as any)?.message || error);
      const isStaleBundleTDZ = /Cannot access '.*' before initialization/i.test(msg) || /before initialization/i.test(msg);
      if (isStaleBundleTDZ) {
        const cacheKey = 'flowkyn_auto_recover_stale_bundle_tdz';
        try {
          const raw = sessionStorage.getItem(cacheKey);
          const attempts = raw ? Number(raw) || 0 : 0;
          if (attempts >= 3) return;
          sessionStorage.setItem(cacheKey, String(attempts + 1));
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

        void (async () => {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch {
            // ignore
          }
        })().finally(() => {
          setTimeout(() => window.location.reload(), 700);
        });
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={this.handleReset}
                >
                  <RotateCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
