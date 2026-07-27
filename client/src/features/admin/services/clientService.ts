import axiosInstance from '@/shared/api/axiosInstance';
import type { Client, UnifiedClientsPagedResponse } from '../types/client';

export interface GetClientsParams {
  page: number;
  limit: number;
  type: 'POS' | 'ECOMMERCE' | 'ALL';
  search?: string;
}

export const clientService = {
  getClients: async (params: GetClientsParams): Promise<UnifiedClientsPagedResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());
    queryParams.append('type', params.type);
    if (params.search) {
      queryParams.append('search', params.search);
    }
    const { data } = await axiosInstance.get<UnifiedClientsPagedResponse>(`/v1/admin/clients?${queryParams.toString()}`);
    return data;
  },

  updateClient: async (id: number, data: Partial<Client>): Promise<Client> => {
    const { data: response } = await axiosInstance.put<{ success: boolean; data: Client }>(`/v1/admin/clients/${id}`, data);
    return response.data;
  },

  toggleUserStatus: async (userId: number, isActive: boolean): Promise<void> => {
    await axiosInstance.patch(`/v1/users/${userId}/status`, { isActive });
  },
};
