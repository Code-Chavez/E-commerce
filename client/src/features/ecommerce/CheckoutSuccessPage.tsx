import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from './hooks/useCart';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export const CheckoutSuccessPage: React.FC = () => {
  useDocumentTitle('Confirmación de Pago');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'processing' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);

  const redirectStatus = searchParams.get('redirect_status');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

  useEffect(() => {
    // Refresh the cart so it is cleared in the client state (the backend webhook handles clearing the DB cart)
    fetchCart();

    if (!redirectStatus) {
      setStatus('error');
      setMessage('Falta información del estado del pago.');
      return;
    }

    switch (redirectStatus) {
      case 'succeeded':
        setStatus('success');
        break;
      case 'processing':
        setStatus('processing');
        break;
      case 'requires_payment_method':
        setStatus('error');
        setMessage('El pago no fue autorizado. Por favor intenta con otro método de pago.');
        break;
      default:
        setStatus('error');
        setMessage('Ocurrió un error inesperado al verificar tu pago.');
        break;
    }
  }, [redirectStatus, paymentIntentClientSecret, fetchCart]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="w-12 h-12 animate-spin text-brand-accent mb-4" />
            <h1 className="text-xl font-bold text-gray-900">Verificando tu pago</h1>
            <p className="text-sm text-gray-500 mt-2">Por favor espera un momento mientras procesamos la confirmación.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-100 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">¡Pago Realizado con Éxito!</h1>
            <p className="text-sm text-gray-500 mt-3 max-w-sm">
              Tu pedido ha sido procesado de forma segura y la orden fue confirmada. Recibirás un correo electrónico de confirmación con los detalles de tu compra.
            </p>
            <div className="w-full border-t border-gray-100 my-8"></div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Seguir Comprando
              </button>
              <Link
                to="/profile"
                className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black transition-colors py-2"
              >
                Ir a mi Perfil <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-500 mb-6 border border-yellow-100">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pago en Procesamiento</h1>
            <p className="text-sm text-gray-500 mt-3 max-w-sm">
              Tu pago se está procesando. Te enviaremos una confirmación por correo tan pronto como se complete el proceso.
            </p>
            <div className="w-full border-t border-gray-100 my-8"></div>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-sm"
            >
              Volver a la Tienda
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-100">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pago Fallido</h1>
            <p className="text-sm text-red-600 bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 mt-3 w-full font-medium">
              {message}
            </p>
            <p className="text-xs text-gray-400 mt-4 max-w-sm">
              Si se realizó algún cargo a tu tarjeta, se reversará automáticamente. Por favor intenta nuevamente.
            </p>
            <div className="w-full border-t border-gray-100 my-8"></div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-sm"
              >
                Reintentar Pago
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
