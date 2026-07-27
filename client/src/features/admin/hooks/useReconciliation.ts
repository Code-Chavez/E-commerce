import { useState } from 'react';
import type { ReconciliationResult, ReconcileStripeDTO } from '../services/reconciliationService';
import { reconciliationService } from '../services/reconciliationService';
import toast from 'react-hot-toast';

export const useReconciliation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reconcileStripe = async (payload: ReconcileStripeDTO) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reconciliationService.reconcileStripe(payload);
      setResult(data);
      toast.success('Conciliación completada exitosamente');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al ejecutar la conciliación';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    result,
    error,
    reconcileStripe,
  };
};
