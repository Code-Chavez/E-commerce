import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Eye, EyeOff } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/resetPassword.schema';

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormData) => void;
  isLoading?: boolean;
}

export const ResetPasswordForm = ({ onSubmit, isLoading = false }: ResetPasswordFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-brand-text">
          Nueva contraseña
        </label>
        <div className="mt-1 relative">
          <input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            disabled={isLoading}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={`appearance-none block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors ${
              errors.newPassword ? 'border-red-300' : 'border-brand-primary'
            }`}
            {...register('newPassword')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-brand-accent transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Debe incluir al menos 1 mayúscula y 1 número.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-text hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Restableciendo...' : 'Establecer nueva contraseña'}
        </button>
      </div>
    </form>
  );
};
