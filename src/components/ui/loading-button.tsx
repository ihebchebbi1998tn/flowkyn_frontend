import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

/**
 * Button with a smooth inline progress bar animation instead of a spinner.
 * When `loading` is true, text transitions and a subtle shimmer plays across the button.
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, children, className, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn('relative overflow-hidden transition-all duration-200', className)}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer overlay when loading */}
        {loading && (
          <span className="absolute inset-0 overflow-hidden">
            <span
              className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.12) 50%, transparent 100%)',
              }}
            />
          </span>
        )}

        {/* Content with smooth text transition */}
        <span
          className={cn(
            'flex items-center gap-2 transition-opacity duration-200',
            loading && 'opacity-0'
          )}
        >
          {children}
        </span>

        {/* Loading text overlay */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center gap-2">
            <span className="flex gap-[3px]">
              <span className="h-[5px] w-[5px] rounded-full bg-current opacity-70 animate-[bounce_1s_ease-in-out_0ms_infinite]" />
              <span className="h-[5px] w-[5px] rounded-full bg-current opacity-70 animate-[bounce_1s_ease-in-out_150ms_infinite]" />
              <span className="h-[5px] w-[5px] rounded-full bg-current opacity-70 animate-[bounce_1s_ease-in-out_300ms_infinite]" />
            </span>
            {loadingText && <span className="text-[13px]">{loadingText}</span>}
          </span>
        )}
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
