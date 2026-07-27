import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

/**
 * GoogleAuthSuccessPage — HU-001 / T-036
 *
 * Intermediate page shown after Google OAuth redirect.
 * Displays a loading spinner while useGoogleAuth extracts the session
 * from the httpOnly cookie, hydrates AuthContext, and redirects to Home.
 */
export default function GoogleAuthSuccessPage() {
  useDocumentTitle('Iniciando sesión...');
  const { isLoading, error } = useGoogleAuth();

  return (
    <div
      className="min-h-screen bg-brand-bg flex flex-col items-center justify-center"
      id="google-auth-success-page"
    >
      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#4285F4] rounded-full animate-spin" />
          <p className="text-brand-text text-lg font-medium">
            Iniciando sesión con Google...
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl text-red-600">
            ✕
          </div>
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <p className="text-brand-text text-sm">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      )}
    </div>
  );
}
