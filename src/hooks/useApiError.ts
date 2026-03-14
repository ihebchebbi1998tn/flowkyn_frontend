import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApiError } from '@/lib/apiError';
import { formatErrorForToast } from '@/lib/formatError';

/**
 * Hook that returns a function to show localized toast errors from API responses.
 * Uses the backend error `code` to look up translations in `apiErrors.*`.
 */
export function useApiError() {
  const { t } = useTranslation();

  /** Show a localized error toast. Accepts any error — gracefully handles non-API errors. */
  const showError = (err: unknown, fallbackMessage?: string) => {
    try {
      if (ApiError.is(err)) {
        // Safely attempt to use translation function
        const localizedMessage = typeof t === 'function' ? t(`apiErrors.${err.code}`, { defaultValue: '' }) : '';
        const message = localizedMessage || err.message || fallbackMessage || '';
        
        // Don't mutate the original error object
        const formatted = formatErrorForToast(
          { ...err, message } as ApiError,
          { fallbackTitle: fallbackMessage || (typeof t === 'function' ? t('apiErrors.UNKNOWN', { defaultValue: 'An error occurred' }) : 'An error occurred') }
        );
        toast.error(formatted.title, formatted.description ? { description: formatted.description } : undefined);
        return;
      }

      // Fallback for non-structured errors
      const fallback = (typeof fallbackMessage === 'string' && fallbackMessage.trim())
        ? fallbackMessage
        : (typeof t === 'function' ? t('apiErrors.UNKNOWN', { defaultValue: 'An error occurred' }) : 'An error occurred');
      const formatted = formatErrorForToast(err, { fallbackTitle: fallback });
      toast.error(formatted.title, formatted.description ? { description: formatted.description } : undefined);
    } catch (error) {
      // Last resort fallback
      toast.error('An unexpected error occurred');
      console.error('Error in showError:', error);
    }
  };

  return { showError };
}
