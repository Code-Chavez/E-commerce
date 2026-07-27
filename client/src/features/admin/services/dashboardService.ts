import axiosInstance from '@/shared/api/axiosInstance';
import type { DashboardKpis } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Obtiene los indicadores clave del negocio (KPIs) acumulados.
   */
  async fetchDashboardKpis(): Promise<DashboardKpis> {
    const { data } = await axiosInstance.get('/v1/admin/dashboard/kpis');
    if (!data.success) {
      throw new Error(data.error || 'No se pudieron cargar los indicadores del dashboard');
    }
    return data.data;
  },
};
