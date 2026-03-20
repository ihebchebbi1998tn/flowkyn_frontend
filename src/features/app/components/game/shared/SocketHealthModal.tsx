import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Radio, RadioTower } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type SocketHealthStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | string;

export interface SocketHealthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatStatus: SocketHealthStatus;
  gamesStatus: SocketHealthStatus;
  chatReady: boolean;
  gamesReady: boolean;
  chatError: string | null;
  chatErrorCode?: string | null;
  chatErrorDetails?: unknown;
  gamesError: string | null;
  gamesErrorCode?: string | null;
  gamesErrorDetails?: unknown;
  extraDetails?: ReactNode;
  onRetryChat: () => void;
  onRetryGames: () => void;
}

function StatusRow({
  label,
  status,
  ready,
}: {
  label: string;
  status: SocketHealthStatus;
  ready: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Radio className={cn('h-4 w-4 shrink-0', ready ? 'text-success' : 'text-muted-foreground')} />
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant={ready ? 'secondary' : 'destructive'}
          className={cn('text-[11px] px-2 py-0.5', ready ? 'bg-success/15 text-success border-success/25' : '')}
        >
          {ready ? 'Ready' : 'Not ready'}
        </Badge>
        <span className="text-[11px] text-muted-foreground">{status}</span>
      </div>
    </div>
  );
}

export function SocketHealthModal({
  open,
  onOpenChange,
  chatStatus,
  gamesStatus,
  chatReady,
  gamesReady,
  chatError,
  chatErrorCode,
  chatErrorDetails,
  gamesError,
  gamesErrorCode,
  gamesErrorDetails,
  extraDetails,
  onRetryChat,
  onRetryGames,
}: SocketHealthModalProps) {
  const hasError = !!chatError || !!gamesError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={cn('h-4 w-4', hasError ? 'text-destructive' : 'text-muted-foreground')} />
            Socket connection issue
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Chat and game updates require Socket.IO. If the sockets are not connected, the game may not start in real time
            and chat messages may not appear.
          </p>

          <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/20">
            <StatusRow label="Chat (events socket)" status={chatStatus} ready={chatReady} />
            <StatusRow label="Game updates (games socket)" status={gamesStatus} ready={gamesReady} />
          </div>

          {(chatError || gamesError) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <RadioTower className="h-4 w-4 text-destructive" />
                Exact error (last received)
              </div>
              <div className="space-y-2">
                {chatError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
                    <div className="font-semibold mb-1">Chat socket</div>
                    <div className="break-words">{chatError}</div>
                    {(chatErrorCode || chatErrorDetails) && (
                      <div className="mt-2 text-[11px] text-red-900/90">
                        {chatErrorCode && <div className="font-semibold">code: {chatErrorCode}</div>}
                        {chatErrorDetails && (
                          <pre className="mt-1 whitespace-pre-wrap break-words bg-transparent border border-red-100 rounded p-2">
                            {typeof chatErrorDetails === 'string'
                              ? chatErrorDetails
                              : JSON.stringify(chatErrorDetails, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {gamesError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
                    <div className="font-semibold mb-1">Games socket</div>
                    <div className="break-words">{gamesError}</div>
                    {(gamesErrorCode || gamesErrorDetails) && (
                      <div className="mt-2 text-[11px] text-red-900/90">
                        {gamesErrorCode && <div className="font-semibold">code: {gamesErrorCode}</div>}
                        {gamesErrorDetails && (
                          <pre className="mt-1 whitespace-pre-wrap break-words bg-transparent border border-red-100 rounded p-2">
                            {typeof gamesErrorDetails === 'string'
                              ? gamesErrorDetails
                              : JSON.stringify(gamesErrorDetails, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {extraDetails}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="flex-1 gap-2" onClick={onRetryChat} disabled={chatReady}>
              <RefreshCw className="h-4 w-4" />
              Retry chat
            </Button>
            <Button type="button" variant="outline" className="flex-1 gap-2" onClick={onRetryGames} disabled={gamesReady}>
              <RefreshCw className="h-4 w-4" />
              Retry games
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Tip: If this keeps happening, ask the host to reload the game session (or wait for the reconnect).
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

