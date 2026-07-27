import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { useLogin } from './hooks/useLogin';
import { useAuth } from '@/shared/context/AuthContext';
import { getDefaultRouteForRole } from '@/shared/types/auth.types';
import type { LoginFormData } from './schemas/login.schema';
import { useBrand } from '@/shared/context/BrandContext';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';

import { useCartContext } from '../context/CartContext';

export default function LoginPage() {
  useDocumentTitle('Iniciar sesión');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: loginHook, isLoading } = useLogin();
  const auth = useAuth();
  const { brandConfig } = useBrand();
  const cartContext = useCartContext();

  const [isForceModalOpen, setIsForceModalOpen] = useState(false);

  // Show error toast if redirected from failed OAuth (HU-001)
  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      toast.error('Error al iniciar sesión con Google. Inténtalo nuevamente.');
    }
  }, [searchParams]);

  // Automatic redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && auth.user.role !== 'CLIENT') {
      navigate(getDefaultRouteForRole(auth.user.role), { replace: true });
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      const result = await loginHook(data);

      // Persist tokens and hydrate user state in AuthContext
      auth.login(result.data.tokens);

      // Merge cart after successful login (HU-041)
      await cartContext.mergeCart();

      toast.success('¡Bienvenido!');

      // Role-based redirect (RBAC)
      const role = auth.user?.role ?? result.data.user?.role;
      if (role && role !== 'CLIENT') {
        navigate(getDefaultRouteForRole(role));
      } else {
        // CLIENT or unknown → e-commerce home
        navigate('/');
      }
    } catch (err: any) {
      if (err.requirePasswordChange) {
        setIsForceModalOpen(true);
        return;
      }
      // Show specific message for Google-only accounts
      if (err.message?.includes('registrada con Google')) {
        toast.error(err.message);
      } else {
        // Generic error — intentionally no field detail revealed (security)
        toast.error('Credenciales inválidas. Por favor verifica tu correo y contraseña.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {brandConfig?.logoVerticalUrl ? (
          <img
            src={brandConfig.logoVerticalUrl}
            alt={brandConfig?.brandName || "Logo"}
            className="h-32 w-auto object-contain mb-4"
          />
        ) : (
          <div className="h-32 w-auto mb-4 flex items-center justify-center">
            <span className="text-4xl font-extrabold text-brand-accent">{brandConfig?.brandName || "D'Mendoza"}</span>
          </div>
        )}
        <h2 className="mt-2 text-center text-3xl font-extrabold text-brand-accent">
          Inicia sesión
        </h2>
        <p className="mt-2 text-center text-sm text-brand-text">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="font-medium text-brand-text hover:text-brand-accent underline transition-colors"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

          {/* OAuth Separator (HU-001 / T-035) */}
          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-4 text-sm text-gray-500">o</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Google OAuth Button (HU-001 / T-035) */}
          <div className="mt-6">
            <GoogleLoginButton />
          </div>
        </div>
      </div>

      <ForcePasswordChangeModal
        isOpen={isForceModalOpen}
        onConfirm={() => {
          setIsForceModalOpen(false);
          navigate('/forgot-password');
        }}
      />
    </div>
  );
}
