import { useState } from 'react';
import { CreditCard, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

interface CreditNoteInputProps {
  onCreditNoteApplied: (discountAmount: number, code: string | null) => void;
}

export const CreditNoteInput = ({ onCreditNoteApplied }: CreditNoteInputProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCreditNote, setAppliedCreditNote] = useState<{code: string, discount: number} | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      // Usamos el endpoint del POS pero pasando el token de usuario web
      const response = await axiosInstance.get(`/v1/pos/credit-notes/validate/${code.trim()}`);
      
      if (response.data?.success && response.data?.data) {
        const discountAmount = response.data.data.amount;
        setAppliedCreditNote({ code, discount: discountAmount });
        onCreditNoteApplied(discountAmount, code);
        toast.success('Vale de crédito aplicado exitosamente');
      } else {
        setError('Vale inválido');
        onCreditNoteApplied(0, null);
        setAppliedCreditNote(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al validar el vale de crédito');
      onCreditNoteApplied(0, null);
      setAppliedCreditNote(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCreditNote(null);
    setError(null);
    onCreditNoteApplied(0, null);
  };

  return (
    <div className="mt-4 border-t pt-4">
      {!appliedCreditNote ? (
        <div>
          <label className="text-sm text-gray-600 mb-2 flex items-center gap-1 font-medium">
            <CreditCard size={16} /> ¿Tienes un Vale de Crédito?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código del vale..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none uppercase"
            />
            <button
              onClick={handleApply}
              disabled={isLoading || !code.trim()}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-accent transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><XCircle size={14}/>{error}</p>}
        </div>
      ) : (
        <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-brand-accent">
            <CheckCircle2 size={18} />
            <div>
              <p className="text-sm font-bold">Vale {appliedCreditNote.code} aplicado</p>
              <p className="text-xs">Saldo a favor de S/ {appliedCreditNote.discount.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={handleRemove} className="text-gray-400 hover:text-red-500 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
