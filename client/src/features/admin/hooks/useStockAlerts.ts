import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';

export interface StockAlert {
  id: number;
  variantId: number;
  branchId: number;
  isActive: boolean;
  createdAt: string;
  variant: {
    sku: string;
    product: {
      name: string;
    }
  };
  branch: {
    name: string;
  };
}

export const useStockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/v1/stock-alerts');
      if (response.data.success) {
        setAlerts(response.data.data);
        setError(null);
      } else {
        setError(response.data.error || 'Error al obtener alertas');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissAlert = async (id: number) => {
    try {
      const response = await axiosInstance.patch(`/v1/stock-alerts/${id}/dismiss`);
      if (response.data.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al ocultar alerta', err);
      return false;
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Polling cada 5 minutos
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    dismissAlert
  };
};
