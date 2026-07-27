import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  isLoading?: boolean;
}

export const LoginForm = ({ onSubmit, isLoading = false }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md">
      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-brand-text">
          Correo electrónico
        </label>
        <div className="mt-1">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors ${
              errors.email ? 'border-red-300' : 'border-brand-primary'
            }`}
            placeholder="tu@correo.com"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-medium text-brand-text">
            Contraseña
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-brand-text hover:text-brand-accent underline transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="mt-1 relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={isLoading}
            className={`appearance-none block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors ${
              errors.password ? 'border-red-300' : 'border-brand-primary'
            }`}
            placeholder="Tu contraseña"
            {...register('password')}
          />
          <button
            type="button"
            id="login-toggle-password"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
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
        {errors.password && (
          <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <div>
        <button
          id="login-submit"
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-text hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </div>
    </form>
  );
};
