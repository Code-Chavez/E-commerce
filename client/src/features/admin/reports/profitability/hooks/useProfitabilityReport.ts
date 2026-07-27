import { useState, useCallback } from 'react';
import { reportService } from '../services/reportService';
import type { GroupByOption, ProfitabilityReportResponse } from '../../../types/profitability';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

export const useProfitabilityReport = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ProfitabilityReportResponse['data'] | null>(null);

  const fetchReport = useCallback(async (groupBy: GroupByOption, from?: string, to?: string) => {
    try {
      setLoading(true);
      const response = await reportService.getProfitabilityReport(groupBy, from, to);
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Ocurrió un error al cargar el reporte de rentabilidad.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    reportData,
    fetchReport,
  };
};
