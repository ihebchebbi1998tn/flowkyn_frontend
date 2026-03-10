import { WifiOff, ServerOff } from 'lucide-react';

interface ConnectionStatusBannerProps {
  isOnline: boolean;
  isBackendUp: boolean;
}

export function ConnectionStatusBanner({ isOnline, isBackendUp }: ConnectionStatusBannerProps) {
  if (isOnline && isBackendUp) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] animate-slide-up">
      <div className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive shadow-elevated backdrop-blur-sm">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline — changes may not be saved</span>
          </>
        ) : (
          <>
            <ServerOff className="h-4 w-4" />
            <span>Server unreachable — retrying…</span>
          </>
        )}
      </div>
    </div>
  );
}
