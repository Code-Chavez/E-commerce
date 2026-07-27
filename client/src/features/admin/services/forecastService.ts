import axiosInstance from '@/shared/api/axiosInstance';
import type { DemandForecastResponse, RestockSuggestionsResponse } from '../types/forecast.types';

export const forecastService = {
  getDemandForecast: async (months: number): Promise<DemandForecastResponse> => {
    const response = await axiosInstance.get<DemandForecastResponse>('/v1/admin/reports/demand-forecast', {
      params: { months },
    });
    return response.data;
  },

  getRestockSuggestions: async (months: number): Promise<RestockSuggestionsResponse> => {
    const response = await axiosInstance.get<RestockSuggestionsResponse>('/v1/admin/reports/restock-suggestions', {
      params: { months },
    });
    return response.data;
  },
};
