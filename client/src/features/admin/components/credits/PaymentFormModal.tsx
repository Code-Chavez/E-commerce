import React, { useState } from 'react';
import { Loader2, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { creditService } from '../../services/creditService';
import { handleNumericKeyDown } from '@/shared/validation/documentValidators';

interface PaymentFormModalProps {
  isOpen: boolean;
  creditId: string;
  pendingBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  creditId,
  pendingBalance,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (numericAmount > pendingBalance) {
      setError(`El monto no puede exceder el saldo pendiente de $${pendingBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await creditService.registerPayment(creditId, numericAmount);
      toast.success('Abono registrado con éxito');
      setAmount('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const apiError = err.response?.data?.error || 'Error al registrar el pago parcial';
      setError(apiError);
      toast.error(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#D9D9D2]/40">
        <form onSubmit={handleSubmit}>
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#3F3F3F]">Registrar Abono</h2>
                <p className="text-xs text-[#6B6B6B] mt-0.5">Crédito ID: {creditId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-[#6B6B6B]">Saldo Pendiente:</span>
                <span className="text-lg font-bold text-rose-600">{`$${pendingBalance.toFixed(2)}`}</span>
              </div>

              <div>
                <label htmlFor="amount" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                  Monto a Abonar
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    id="amount"
                    placeholder="0.00"
                    value={amount}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setAmount(e.target.value);
                    }}
                    className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 text-[#3F3F3F] font-semibold text-lg"
                    disabled={loading}
                    required
                  />
                </div>
                {error && <p className="text-xs text-rose-600 font-bold mt-2">{error}</p>}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#FAFAFA] flex gap-3 justify-end border-t border-[#D9D9D2]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#3F3F3F] font-bold hover:bg-[#D9D9D2]/20 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm cursor-pointer border border-[#D9D9D2]/40 bg-white"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold px-5 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-md cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
