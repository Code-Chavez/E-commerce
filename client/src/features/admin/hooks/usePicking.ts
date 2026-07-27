import { useState, useCallback } from 'react';
import { logisticsService } from '../services/logistics.service';
import type { Delivery } from '../types/logistics.types';

export const usePicking = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingPickings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await logisticsService.getDeliveries('PENDING');
      setDeliveries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los pickings generados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deliveries,
    isLoading,
    error,
    fetchPendingPickings,
  };
};
