import { useState } from 'react';
import { getApiUrl } from '@/shared/config/env';
import type { ForgotPasswordFormData } from '../schemas/forgotPassword.schema';

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const forgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        if (Array.isArray(result.error)) {
          throw new Error(result.error[0]?.message || 'Error de validación');
        } else if (typeof result.error === 'string') {
          throw new Error(result.error);
        } else if (typeof result.message === 'string') {
          throw new Error(result.message);
        } else {
          throw new Error('Error al enviar solicitud');
        }
      }

      setIsSuccess(true);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { forgotPassword, isLoading, isSuccess };
};
