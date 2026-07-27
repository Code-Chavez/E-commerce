import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardKpis } from '../types/dashboard.types';

export const useDashboardKpis = () => {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.fetchDashboardKpis();
      setKpis(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al obtener los indicadores de negocio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  return {
    kpis,
    loading,
    error,
    refresh: fetchKpis,
  };
};
