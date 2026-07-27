import axiosInstance from '@/shared/api/axiosInstance';
import type { GroupByOption, ProfitabilityReportResponse } from '../../../types/profitability';

export const reportService = {
  getProfitabilityReport: async (
    groupBy: GroupByOption,
    from?: string,
    to?: string
  ): Promise<ProfitabilityReportResponse> => {
    const params = new URLSearchParams();
    params.append('groupBy', groupBy);
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const { data } = await axiosInstance.get<ProfitabilityReportResponse>(
      `/v1/admin/reports/profitability?${params.toString()}`
    );
    return data;
  },
};
