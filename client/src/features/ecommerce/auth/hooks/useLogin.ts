import { useState } from 'react';
import { getApiUrl } from '@/shared/config/env';
import type { LoginFormData } from '../schemas/login.schema';

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle different error formats from the backend
        if (result.requirePasswordChange) {
          const forceChangeError = new Error(result.error || 'Cambio de contraseña obligatorio');
          (forceChangeError as any).requirePasswordChange = true;
          throw forceChangeError;
        }

        if (Array.isArray(result.error)) {
          // Zod validation error array (HTTP 400)
          throw new Error(result.error[0]?.message || 'Error de validación');
        } else if (typeof result.error === 'string') {
          // Generic string error (HTTP 401, 403)
          throw new Error(result.error);
        } else {
          throw new Error('Ocurrió un error inesperado');
        }
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al intentar iniciar sesión';
      setError(errorMessage);
      if (err instanceof Error && (err as any).requirePasswordChange) {
        throw err;
      }
      throw new Error(errorMessage, { cause: err });
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
