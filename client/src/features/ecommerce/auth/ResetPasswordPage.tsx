import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { useResetPassword } from './hooks/useResetPassword';
import type { ResetPasswordFormData } from './schemas/resetPassword.schema';
import { useBrand } from '@/shared/context/BrandContext';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  useDocumentTitle('Nueva contraseña');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { resetPassword, isLoading } = useResetPassword();
  const { brandConfig } = useBrand();

  const handleSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Falta el token de seguridad');
      return;
    }

    try {
      await resetPassword(token, data);
      toast.success('¡Contraseña actualizada exitosamente!', { duration: 5000 });
      // Secure redirect back to login after operation succeeds
      navigate('/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo restablecer la clave';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {brandConfig?.logoVerticalUrl ? (
          <img src={brandConfig.logoVerticalUrl} alt={brandConfig?.brandName || "Logo"} className="h-32 w-auto object-contain mb-4" />
        ) : (
          <div className="h-32 w-auto mb-4 flex items-center justify-center">
            <span className="text-4xl font-extrabold text-brand-accent">{brandConfig?.brandName || "D'Mendoza"}</span>
          </div>
        )}
        <h2 className="mt-2 text-center text-3xl font-extrabold text-brand-accent">
          Establecer Nueva Contraseña
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!token ? (
            <div className="text-center py-4 space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="text-red-700 font-medium">El enlace no es válido.</p>
              <p className="text-sm text-brand-text">Asegúrate de haber hecho clic en el enlace completo enviado a tu correo.</p>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-brand-text text-center">
                Por favor elige una nueva contraseña robusta que no hayas utilizado previamente.
              </p>
              <ResetPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-brand-text hover:text-brand-accent underline transition-colors">
              Cancelar y volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
