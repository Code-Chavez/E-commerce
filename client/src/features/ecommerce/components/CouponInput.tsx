import { useState } from 'react';
import { Tag, Loader2, XCircle, CheckCircle2 } from 'lucide-react';

interface CouponInputProps {
  subtotal: number;
  onCouponApplied: (discountAmount: number, code: string | null) => void;
}

export const CouponInput = ({ subtotal, onCouponApplied }: CouponInputProps) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal })
      });
      const data = await response.json();
      
      if (!response.ok || !data.valid) {
        setError(data.message || data.error || 'Cupón inválido');
        onCouponApplied(0, null);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code, discount: data.discountAmount });
        onCouponApplied(data.discountAmount, code);
      }
    } catch (err) {
      setError('Error al validar el cupón');
      onCouponApplied(0, null);
      setAppliedCoupon(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCoupon(null);
    setError(null);
    onCouponApplied(0, null);
  };

  return (
    <div className="mt-4 border-t pt-4">
      {!appliedCoupon ? (
        <div>
          <label className="text-sm text-gray-600 mb-2 flex items-center gap-1 font-medium">
            <Tag size={16} /> ¿Tienes un cupón de descuento?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej. VERANO20"
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 size={18} />
            <div>
              <p className="text-sm font-bold">Cupón {appliedCoupon.code} aplicado</p>
              <p className="text-xs">Descuento de S/ {appliedCoupon.discount.toFixed(2)}</p>
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
