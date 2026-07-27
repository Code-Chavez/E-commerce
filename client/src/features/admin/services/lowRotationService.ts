import axiosInstance from '@/shared/api/axiosInstance';
import type { LowRotationResponse } from '../types/lowRotation.types';

export const lowRotationService = {
  getLowRotation: async (days: number): Promise<LowRotationResponse> => {
    const response = await axiosInstance.get<LowRotationResponse>('/v1/admin/reports/low-rotation', {
      params: { days },
    });
    return response.data;
  },
};
