import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { useForgotPassword } from './hooks/useForgotPassword';
import type { ForgotPasswordFormData } from './schemas/forgotPassword.schema';
import { useBrand } from '@/shared/context/BrandContext';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  useDocumentTitle('Recuperar contraseña');
  const { forgotPassword, isLoading, isSuccess } = useForgotPassword();
  const { brandConfig } = useBrand();

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data);
      toast.success('Solicitud procesada');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al procesar solicitud';
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
          Recuperar Contraseña
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!isSuccess ? (
            <>
              <p className="mb-6 text-sm text-brand-text text-center">
                Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecer tu clave.
              </p>
              <ForgotPasswordForm onSubmit={handleSubmit} isLoading={isLoading} />
            </>
          ) : (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="text-lg font-medium text-brand-accent">¡Enlace enviado!</h3>
              <p className="text-sm text-brand-text">
                Si tu correo está registrado en nuestro sistema, recibirás un email con las instrucciones en unos minutos.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-brand-text hover:text-brand-accent underline transition-colors">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
