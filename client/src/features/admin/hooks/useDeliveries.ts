import { useState, useCallback } from 'react';
import { logisticsService } from '../services/logistics.service';
import type { Delivery } from '../types/logistics.types';

export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async (status?: string) => {
    setIsLoading(true);
    try {
      const data = await logisticsService.getDeliveries(status);
      setDeliveries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los despachos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deliveries,
    setDeliveries,
    isLoading,
    error,
    fetchDeliveries,
  };
};
