import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Loader2, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PaymentFormProps {
  total: number;
  onBack: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ total, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe has not loaded yet
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      // This point is only reached if there is an immediate error confirming the payment.
      // Otherwise, the customer will be redirected to the return_url.
      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message || 'Ocurrió un problema de validación con el pago.');
        } else {
          setErrorMessage('Ocurrió un error inesperado al procesar el pago.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error en la pasarela de pagos.');
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Método de Pago</h2>
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Envío
          </button>
        </div>

        {/* Stripe Elements Payment Form */}
        <div className="mb-6 min-h-[220px]">
          <PaymentElement 
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Pay Button */}
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando pago...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Pagar S/ {total.toFixed(2)}</span>
            </>
          )}
        </button>

        {/* Security badges and text */}
        <div className="mt-4 flex flex-col items-center justify-center gap-1 text-center">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-green-500" />
            Conexión cifrada de 256 bits. Pago procesado de manera segura por Stripe.
          </span>
        </div>
      </div>
    </form>
  );
};
