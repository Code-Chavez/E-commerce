import React from 'react';
import type { RefundType } from '../../types';

interface ReturnReasonFormProps {
  reason: string;
  onChangeReason: (val: string) => void;
  refundType: RefundType;
  onChangeRefundType: (val: RefundType) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isValid: boolean; // From parent (checks items selected, reason not empty, etc.)
}

export const ReturnReasonForm: React.FC<ReturnReasonFormProps> = ({
  reason,
  onChangeReason,
  refundType,
  onChangeRefundType,
  onSubmit,
  isSubmitting,
  isValid,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Refund Type Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-extrabold text-brand-accent">
          Método de Reembolso
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Credit Note Option */}
          <div
            onClick={() => onChangeRefundType('CREDIT_NOTE')}
            className={`p-4 border rounded-2xl cursor-pointer flex flex-col justify-between transition-all ${
              refundType === 'CREDIT_NOTE'
                ? 'border-brand-accent bg-brand-primary/5 ring-1 ring-brand-accent'
                : 'border-brand-primary/20 hover:bg-brand-primary/5 bg-white'
            }`}
          >
            <div>
              <p className="text-xs font-extrabold text-[#3F3F3F]">Nota de Crédito</p>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                Se emitirá un comprobante electrónico de nota de crédito por el valor de los productos devueltos.
              </p>
            </div>
            <div className="flex justify-end mt-3">
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  refundType === 'CREDIT_NOTE'
                    ? 'border-brand-accent bg-brand-accent'
                    : 'border-gray-300'
                }`}
              >
                {refundType === 'CREDIT_NOTE' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
            </div>
          </div>

          {/* Store Credit Option */}
          <div
            onClick={() => onChangeRefundType('STORE_CREDIT')}
            className={`p-4 border rounded-2xl cursor-pointer flex flex-col justify-between transition-all ${
              refundType === 'STORE_CREDIT'
                ? 'border-brand-accent bg-brand-primary/5 ring-1 ring-brand-accent'
                : 'border-brand-primary/20 hover:bg-brand-primary/5 bg-white'
            }`}
          >
            <div>
              <p className="text-xs font-extrabold text-[#3F3F3F]">Saldo a Favor (Crédito en Tienda)</p>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                El monto se agregará como saldo a favor en tu cuenta para ser usado en futuras compras.
              </p>
            </div>
            <div className="flex justify-end mt-3">
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  refundType === 'STORE_CREDIT'
                    ? 'border-brand-accent bg-brand-accent'
                    : 'border-gray-300'
                }`}
              >
                {refundType === 'STORE_CREDIT' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reason for Return Textarea */}
      <div className="space-y-2">
        <label htmlFor="reason" className="block text-sm font-extrabold text-brand-accent">
          Motivo de la Devolución
        </label>
        <textarea
          id="reason"
          rows={4}
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          placeholder="Describe detalladamente el motivo de la devolución (ej. La prenda vino con un hilo suelto, no me quedó la talla, etc.)"
          className="w-full rounded-2xl border border-brand-primary/30 p-3 text-xs text-[#3F3F3F] placeholder-gray-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none bg-white transition-all resize-none"
        />
        <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
          <span>Por favor sé lo más específico posible.</span>
          <span>{reason.trim().length} caracteres (mín. 10)</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full sm:w-auto px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4.5 w-4.5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Enviando Solicitud...
            </>
          ) : (
            'Enviar Solicitud de Devolución'
          )}
        </button>
      </div>
    </form>
  );
};
