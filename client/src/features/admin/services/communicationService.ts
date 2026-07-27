import axiosInstance from '@/shared/api/axiosInstance';
import type { ClientCommunicationsResponse } from '../types/communication.types';

export const communicationService = {
  getClientCommunications: async (clientId: number): Promise<ClientCommunicationsResponse> => {
    const { data } = await axiosInstance.get<ClientCommunicationsResponse>(
      `/v1/admin/clients/${clientId}/communications`
    );
    return data;
  },
};
