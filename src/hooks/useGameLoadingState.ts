import { useCallback, useState } from 'react';

export function useGameLoadingState(initial = false) {
  const [isLoading, setIsLoading] = useState(initial);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, setIsLoading, withLoading };
}
