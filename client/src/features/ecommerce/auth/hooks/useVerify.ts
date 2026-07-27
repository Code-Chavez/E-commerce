import { useState } from 'react';
import { getApiUrl } from '@/shared/config/env';

export const useVerify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (email: string, pin: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/v1/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, pin }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : typeof result.message === 'string'
          ? result.message
          : 'Error al verificar el código';
        throw new Error(errorMessage);
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar cuenta';
      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setIsLoading(false);
    }
  };

  return { verify, isLoading, error };
};
