import axiosInstance from '@/shared/api/axiosInstance';

export interface LoyaltyConfig {
  id?: number;
  solesPerPoint: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const loyaltyAdminService = {
  getLoyaltyConfig: async (): Promise<LoyaltyConfig | null> => {
    const response = await axiosInstance.get<ApiResponse<LoyaltyConfig>>('/v1/admin/loyalty-config');
    return response.data.data;
  },

  updateLoyaltyConfig: async (config: { solesPerPoint: number }): Promise<LoyaltyConfig> => {
    const response = await axiosInstance.put<ApiResponse<LoyaltyConfig>>('/v1/admin/loyalty-config', config);
    return response.data.data;
  }
};
