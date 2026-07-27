import axiosInstance from '@/shared/api/axiosInstance';
import type { ReturnRequestInput, ReturnRequest } from '../types';

export const returnService = {
  /**
   * Crea una solicitud de devolución para un pedido.
   */
  async createReturnRequest(input: ReturnRequestInput): Promise<ReturnRequest> {
    const { data } = await axiosInstance.post('/v1/returns', input);
    if (!data.success) {
      throw new Error(data.error || 'No se pudo crear la solicitud de devolución');
    }
    return data.data;
  },
};
