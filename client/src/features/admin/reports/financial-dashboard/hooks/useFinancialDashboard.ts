import { useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { FinancialDashboardSummary } from '../../../types/financial-dashboard';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

export const useFinancialDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<FinancialDashboardSummary | null>(null);

  const fetchDashboard = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const data = await dashboardService.getFinancialDashboard(from, to);
      setSummary(data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.error) {
        const backendError = error.response.data.error;
        if (Array.isArray(backendError)) {
          backendError.forEach((err: any) => toast.error(err.message || 'Error de validación'));
        } else {
          toast.error(typeof backendError === 'string' ? backendError : (backendError.message || 'Error al obtener el reporte'));
        }
      } else {
        toast.error('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    summary,
    fetchDashboard
  };
};
