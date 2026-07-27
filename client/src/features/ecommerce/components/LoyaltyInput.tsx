import { useState, useEffect } from 'react';
import { Gift, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { useLoyalty } from '../profile/hooks/useLoyalty';
import { handleIntegerKeyDown } from '@/shared/validation/documentValidators';

interface LoyaltyInputProps {
  maxAllowedDiscount: number;
  onLoyaltyApplied: (discountAmount: number, points: number) => void;
}

export const LoyaltyInput = ({ maxAllowedDiscount, onLoyaltyApplied }: LoyaltyInputProps) => {
  const { account, fetchBalance, isLoading: isFetchingBalance } = useLoyalty();
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [appliedPoints, setAppliedPoints] = useState<number | null>(null);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleApply = () => {
    setError(null);
    const points = Number(pointsToRedeem);
    
    if (isNaN(points) || points <= 0) {
      setError('Ingresa una cantidad válida de puntos.');
      return;
    }
    if (account && points > account.balance) {
      setError(`Solo tienes ${account.balance} puntos disponibles.`);
      return;
    }
    if (points > maxAllowedDiscount) {
      setError(`Solo puedes aplicar hasta ${maxAllowedDiscount.toFixed(2)} puntos a esta orden.`);
      return;
    }

    setAppliedPoints(points);
    onLoyaltyApplied(points, points);
  };

  const handleRemove = () => {
    setPointsToRedeem('');
    setAppliedPoints(null);
    setError(null);
    onLoyaltyApplied(0, 0);
  };

  if (isFetchingBalance) {
    return (
      <div className="mt-4 border-t pt-4 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" /> Consultando saldo de puntos...
      </div>
    );
  }

  // Si no tiene cuenta de lealtad o tiene 0 puntos, no mostrar el input
  if (!account || account.balance <= 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-4">
      {!appliedPoints ? (
        <div>
          <label className="text-sm text-gray-600 mb-2 flex items-center gap-1 font-medium">
            <Gift size={16} /> Canjear Puntos (Disponibles: {account.balance})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={Math.min(account.balance, maxAllowedDiscount)}
              value={pointsToRedeem}
              onKeyDown={handleIntegerKeyDown}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val < 0) return;
                setPointsToRedeem(e.target.value);
              }}
              placeholder="Cant. de puntos"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
            />
            <button
              onClick={handleApply}
              disabled={!pointsToRedeem}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-accent transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
            >
              Aplicar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">1 punto = S/ 1.00 de descuento</p>
          {error && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><XCircle size={14}/>{error}</p>}
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-700">
            <CheckCircle2 size={18} />
            <div>
              <p className="text-sm font-bold">{appliedPoints} Puntos canjeados</p>
              <p className="text-xs">Descuento de S/ {appliedPoints.toFixed(2)}</p>
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
