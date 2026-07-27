import axiosInstance from '@/shared/api/axiosInstance';
import type { CreditNote } from '../types/credit-note';

export const creditNotesService = {
  getCreditNotes: async (): Promise<CreditNote[]> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: CreditNote[] }>('/v1/admin/credit-notes');
    return data.data;
  },

  resendPdf: async (id: number): Promise<void> => {
    await axiosInstance.post(`/v1/admin/credit-notes/${id}/resend`);
  },
};
