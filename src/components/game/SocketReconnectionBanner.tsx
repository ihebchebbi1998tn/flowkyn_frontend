/**
 * Real-time reconnection banner displayed when socket connection drops.
 * Shows status and manual retry button.
 */
import { useTranslation } from 'react-i18next';
import { WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface SocketReconnectionBannerProps {
  status: ConnectionStatus;
  onReconnect: () => void;
  className?: string;
}

export function SocketReconnectionBanner({ status, onReconnect, className }: SocketReconnectionBannerProps) {
  const { t } = useTranslation();

  const isVisible = status === 'reconnecting' || status === 'disconnected';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'overflow-hidden',
            className
          )}
        >
          <div className={cn(
            'flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg',
            status === 'reconnecting'
              ? 'bg-warning/10 text-warning border border-warning/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          )}>
            {status === 'reconnecting' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t('socket.reconnecting', { defaultValue: 'Reconnecting…' })}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>{t('socket.disconnected', { defaultValue: 'Connection lost' })}</span>
                <button
                  type="button"
                  onClick={onReconnect}
                  className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/10 hover:bg-destructive/20 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t('socket.retry', { defaultValue: 'Retry' })}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
