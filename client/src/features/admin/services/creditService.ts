import axiosInstance from '@/shared/api/axiosInstance';
import type { PendingBalanceResponse, CreditPayment } from '../types/credit.types';

export const creditService = {
  getCreditsByClient: async (clientId: number): Promise<PendingBalanceResponse> => {
    const { data } = await axiosInstance.get<PendingBalanceResponse>(`/v1/credits?clientId=${clientId}`);
    return data;
  },

  registerPayment: async (creditId: string, amount: number): Promise<CreditPayment> => {
    const { data } = await axiosInstance.post<CreditPayment>(`/v1/credits/${creditId}/payments`, { amount });
    return data;
  },
};
