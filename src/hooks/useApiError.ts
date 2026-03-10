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
  const showError = (err: unknown, fallbackMessage?: string) => {
    if (ApiError.is(err)) {
      const localizedMessage = t(`apiErrors.${err.code}`, { defaultValue: '' });
      const message = localizedMessage || err.message;

      // If there are field-level details, append them
      if (err.details?.length) {
        const detailText = err.details.map(d => `${d.field}: ${d.message}`).join(', ');
        toast.error(message, { description: detailText });
      } else {
        toast.error(message);
      }
      return;
    }

    // Fallback for non-structured errors
    const message = err instanceof Error ? err.message : fallbackMessage || t('apiErrors.UNKNOWN');
    toast.error(message);
  };

  return { showError };
}
