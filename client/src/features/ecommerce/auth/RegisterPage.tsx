import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RegisterForm } from './components/RegisterForm';
import { useRegister } from './hooks/useRegister';
import type { RegisterFormData } from './schemas/register.schema';
import { useBrand } from '@/shared/context/BrandContext';

import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export default function RegisterPage() {
  useDocumentTitle('Crear cuenta');
  const navigate = useNavigate();
  const { register, isLoading } = useRegister();
  const { brandConfig } = useBrand();

  const handleRegister = async (data: RegisterFormData) => {
    try {
      await register(data);
      toast.success('Registro exitoso. Por favor revisa tu correo para el código de verificación.');
      // Redirect to verification page sending email as query param
      navigate(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en el registro';
      toast.error(message);
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
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-brand-text">
          O{' '}
          <Link to="/login" className="font-medium text-brand-text hover:text-brand-accent underline transition-colors">
            inicia sesión si ya tienes cuenta
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
