import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export default function UnauthorizedPage() {
  useDocumentTitle('Acceso Restringido');

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6">
          <ShieldAlert className="h-10 w-10 text-red-600" aria-hidden="true" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2">
          403
        </h1>
        
        <h2 className="text-xl font-bold text-brand-accent mb-4">
          Acceso No Autorizado
        </h2>
        
        <p className="text-base text-brand-text mb-8">
          Lo sentimos, no posees los permisos suficientes en tu cuenta actual para visualizar el contenido de esta sección.
        </p>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-text hover:bg-brand-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
          >
            Volver a la página de inicio
          </Link>
          
          <Link
            to="/login"
            className="w-full inline-block py-2.5 text-sm font-medium text-brand-accent hover:text-gray-900 underline bg-transparent transition-colors"
          >
            Iniciar sesión con otra cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
