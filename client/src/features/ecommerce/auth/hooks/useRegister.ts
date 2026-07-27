import { useState } from 'react';
import { getApiUrl } from '@/shared/config/env';
import type { RegisterFormData } from '../schemas/register.schema';

export const useRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        if (response.status === 409) {
          throw new Error('El correo electrónico ya está registrado. Por favor, intenta iniciar sesión.');
        }
        
        // Handle different error formats coming from backend
        if (Array.isArray(result.error)) {
          // Zod error array
          throw new Error(result.error[0]?.message || 'Error de validación');
        } else if (typeof result.error === 'string') {
          // Single string error
          throw new Error(result.error);
        } else if (typeof result.message === 'string') {
          throw new Error(result.message);
        } else {
          throw new Error('Ocurrió un error inesperado');
        }
      }

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al intentar registrarse';
      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
};
