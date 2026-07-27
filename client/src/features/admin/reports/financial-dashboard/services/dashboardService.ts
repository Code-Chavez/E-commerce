import axiosInstance from '@/shared/api/axiosInstance';
import type { FinancialDashboardSummary } from '../../../types/financial-dashboard';

export const dashboardService = {
  getFinancialDashboard: async (from?: string, to?: string): Promise<FinancialDashboardSummary> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await axiosInstance.get<{ success: boolean; data: FinancialDashboardSummary }>(
      `/v1/admin/reports/financial-dashboard?${params.toString()}`
    );
    return response.data.data;
  }
};
