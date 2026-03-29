/**
 * @fileoverview Global error/retry component for failed API fetches.
 * Use this alongside EmptyState — ErrorState is for errors, EmptyState is for "no data".
 */
import { AlertCircle, RotateCcw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Detailed description */
  description?: string;
  /** Called when user clicks retry */
  onRetry?: () => void;
  /** Show as network error variant */
  isNetworkError?: boolean;
  /** Custom class */
  className?: string;
}

export function ErrorState({
  message = 'Failed to load data',
  description = 'Something went wrong. Please check your connection and try again.',
  onRetry,
  isNetworkError,
  className,
}: ErrorStateProps) {
  const Icon = isNetworkError ? WifiOff : AlertCircle;

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className || ''}`} role="alert" aria-live="polite">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/8 border border-destructive/15 mb-4">
        <Icon className="h-6 w-6 text-destructive/70" aria-hidden="true" />
      </div>
      <p className="text-body-sm font-semibold text-foreground mb-1">{message}</p>
      <p className="text-label text-muted-foreground max-w-sm leading-relaxed mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}
