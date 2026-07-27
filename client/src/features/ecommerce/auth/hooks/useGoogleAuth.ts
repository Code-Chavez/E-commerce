import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { getApiUrl } from '@/shared/config/env';

import { useCartContext } from '../../context/CartContext';

/**
 * useGoogleAuth — HU-001 / T-036
 *
 * Extracts session from httpOnly cookie after Google OAuth redirect.
 * Calls GET /api/v1/auth/me (with credentials) to retrieve the JWT from
 * the cookie, hydrates AuthContext, and redirects to Home.
 */
export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();
  const cartContext = useCartContext();

  useEffect(() => {
    const extractSession = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/v1/auth/me`, {
          method: 'GET',
          credentials: 'include', // Send cookies cross-origin
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Error al obtener la sesión');
        }

        // Hydrate AuthContext with the extracted tokens
        auth.login(result.data.tokens);

        // Merge cart after successful Google login (HU-041)
        await cartContext.mergeCart();

        // Redirect to e-commerce Home
        navigate('/', { replace: true });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al procesar la autenticación con Google';
        setError(errorMessage);
        // Redirect to login after a brief delay so user sees the error
        setTimeout(() => navigate('/login?error=oauth_failed', { replace: true }), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    extractSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading, error };
};
