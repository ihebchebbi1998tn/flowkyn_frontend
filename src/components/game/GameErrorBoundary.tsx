/**
 * Game-specific error boundary with retry and reconnection support.
 * Wraps individual game boards to prevent one game's error from crashing the entire play page.
 */
import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  gameName?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[GameErrorBoundary${this.props.gameName ? `: ${this.props.gameName}` : ''}]`, error, info);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isNetworkError = /fetch|network|socket|timeout/i.test(this.state.error?.message || '');

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center rounded-xl border border-border bg-card" role="alert">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mb-3">
          {isNetworkError ? (
            <WifiOff className="h-6 w-6 text-destructive" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-destructive" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {this.props.gameName
            ? `${this.props.gameName} encountered an error`
            : 'Game error'}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 max-w-sm">
          {isNetworkError
            ? 'Connection lost. Please check your internet and try again.'
            : 'Something went wrong. Your progress is saved — try reloading.'}
        </p>
        {this.state.error && (
          <pre className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3 max-w-md overflow-auto">
            {this.state.error.message}
          </pre>
        )}
        <Button onClick={this.handleRetry} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          {this.state.retryCount > 2 ? 'Reload page' : 'Try again'}
        </Button>
      </div>
    );
  }
}
