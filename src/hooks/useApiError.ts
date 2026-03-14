import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApiError } from '@/lib/apiError';

/**
 * Hook that returns a function to show localized toast errors from API responses.
 * Uses the backend error `code` to look up translations in `apiErrors.*`.
 */
export function useApiError() {
  const { t } = useTranslation();

  /** Show a localized error toast. Accepts any error — gracefully handles non-API errors. */
  const showError = useCallback((err: unknown, fallbackMessage?: string) => {
    try {
      if (ApiError.is(err)) {
        try {
          // Safely attempt to use translation function
          const localizedMessage = typeof t === 'function' ? t(`apiErrors.${err.code}`, { defaultValue: '' }) : '';
          const message = localizedMessage || err.message;

          // If there are field-level details, append them
          if (err.details?.length) {
            const detailText = err.details.map(d => `${d.field}: ${d.message}`).join(', ');
            toast.error(message, { description: detailText });
          } else {
            toast.error(message);
          }
        } catch {
          // If translation fails, fall back to error message
          toast.error(err.message);
        }
        return;
      }

      // Fallback for non-structured errors
      let message = '';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof fallbackMessage === 'string') {
        message = fallbackMessage;
      } else {
        try {
          message = typeof t === 'function' ? t('apiErrors.UNKNOWN') : 'An error occurred';
        } catch {
          message = 'An error occurred';
        }
      }
      toast.error(message);
    } catch (error) {
      // Last resort fallback
      toast.error('An unexpected error occurred');
      console.error('Error in showError:', error);
    }
  }, [t]);

  return { showError };
}
