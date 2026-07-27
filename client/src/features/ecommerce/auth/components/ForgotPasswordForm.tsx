import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/forgotPassword.schema';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => void;
  isLoading?: boolean;
}

export const ForgotPasswordForm = ({ onSubmit, isLoading = false }: ForgotPasswordFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md">
      <div>
        <label htmlFor="recovery-email" className="block text-sm font-medium text-brand-text">
          Correo electrónico
        </label>
        <div className="mt-1">
          <input
            id="recovery-email"
            type="email"
            disabled={isLoading}
            autoComplete="email"
            placeholder="tu@correo.com"
            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors ${
              errors.email ? 'border-red-300' : 'border-brand-primary'
            }`}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-text hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </div>
    </form>
  );
};
