import { X } from 'lucide-react';

interface SmoothUpdateProgressProps {
  progress: number;
  isReloading: boolean;
  onCancel: () => void;
}

export function SmoothUpdateProgress({ progress, isReloading, onCancel }: SmoothUpdateProgressProps) {
  if (progress <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-fade-in">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted/50">
        <div
          className="h-full bg-gradient-to-r from-info to-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pill notification */}
      {progress > 40 && (
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground shadow-elevated animate-slide-up">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-info" />
            </span>
            <span>{isReloading ? 'Applying update…' : 'Updating app…'}</span>
            {progress < 90 && !isReloading && (
              <button
                onClick={onCancel}
                className="ml-1 rounded-full p-0.5 hover:bg-muted transition-colors"
                aria-label="Cancel update"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
