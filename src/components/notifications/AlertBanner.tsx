import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface AlertBannerProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  className?: string;
  onClose?: () => void;
}

const config = {
  success: { icon: CheckCircle, classes: 'bg-success/8 border-success/20 text-success' },
  warning: { icon: AlertTriangle, classes: 'bg-warning/8 border-warning/20 text-warning' },
  error: { icon: XCircle, classes: 'bg-destructive/8 border-destructive/20 text-destructive' },
  info: { icon: Info, classes: 'bg-info/8 border-info/20 text-info' },
};

export function AlertBanner({ type, message, className, onClose }: AlertBannerProps) {
  const { icon: Icon, classes } = config[type];
  return (
    <div className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px]", classes, className)}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-50 hover:opacity-100 transition-opacity">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
