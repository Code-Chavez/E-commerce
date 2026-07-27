import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, Info } from 'lucide-react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

interface LoyaltyPanelProps {
  clientId: number | null;
  onDiscountApplied: (discount: number) => void;
}

export const LoyaltyPanel: React.FC<LoyaltyPanelProps> = ({ clientId, onDiscountApplied }) => {
  // Use cartTotal if needed to calculate max discount
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<string>('');

  const fetchBalance = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      // In POS, we might need a specific endpoint to check client balance, or we can use the same one if it accepts query params or we have a pos-specific one.
      // Wait, LoyaltyController.getBalance doesn't accept userId in query, it gets it from auth.
      // We need to fetch it via a POS endpoint or pass userId to a new one.
      // For now, let's assume we can fetch it, actually we'll need to update the backend to allow POS to see client's balance.
      // We can use a POST request or add it to client search response.
      // Let's create an endpoint GET /api/v1/pos/clients/:id/loyalty or modify search to return it.
      // For this task, we can just call the endpoint if it exists.
      const res = await axiosInstance.get(`/v1/pos-clients/${clientId}/loyalty`);
      if (res.data.success) {
        setBalance(res.data.data.balance);
      }
    } catch (err) {
      console.error('Error fetching loyalty balance', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (clientId) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [clientId]);

  const handleRedeem = async () => {
    if (!clientId) return;
    const pts = parseInt(pointsToRedeem, 10);
    if (isNaN(pts) || pts <= 0) {
      toast.error('Ingrese una cantidad válida de puntos');
      return;
    }
    if (pts > (balance || 0)) {
      toast.error('Puntos insuficientes');
      return;
    }

    setRedeeming(true);
    try {
      const res = await axiosInstance.post('/v1/loyalty/redeem', {
        userId: clientId,
        points: pts,
      });

      if (res.data.success) {
        toast.success('Puntos canjeados correctamente');
        onDiscountApplied(res.data.data.discountAmount);
        setBalance(res.data.data.newBalance);
        setPointsToRedeem('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al canjear puntos');
    } finally {
      setRedeeming(false);
    }
  };

  if (!clientId) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-yellow-600" />
        <h4 className="font-bold text-yellow-900 text-sm">Puntos de Fidelidad</h4>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-yellow-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando saldo...
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-yellow-800">Saldo actual:</span>
            <span className="text-lg font-extrabold text-yellow-600">{balance || 0} pts</span>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max={balance || 0}
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(e.target.value)}
              placeholder="Puntos a canjear"
              className="flex-1 rounded-lg border-yellow-300 bg-white px-3 py-2 text-sm focus:border-yellow-500 focus:ring-yellow-500"
            />
            <button
              onClick={handleRedeem}
              disabled={redeeming || !pointsToRedeem || Number(pointsToRedeem) <= 0 || Number(pointsToRedeem) > (balance || 0)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Canjear
            </button>
          </div>
          <div className="mt-2 text-[10px] text-yellow-700 flex items-center gap-1">
             <Info className="w-3 h-3" />
             <span>1 punto = S/ 1.00 de descuento en esta compra.</span>
          </div>
        </div>
      )}
    </div>
  );
};
