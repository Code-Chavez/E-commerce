import axiosInstance from '@/shared/api/axiosInstance';

export interface BackupConfig {
  id?: number;
  retentionDays: number;
  adminEmail: string;
  cronExpression: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const backupConfigService = {
  getConfig: async (): Promise<BackupConfig> => {
    const response = await axiosInstance.get<ApiResponse<BackupConfig>>('/v1/admin/backup-config');
    return response.data.data;
  },

  updateConfig: async (data: Partial<Pick<BackupConfig, 'retentionDays' | 'adminEmail' | 'cronExpression'>>): Promise<BackupConfig> => {
    const response = await axiosInstance.put<ApiResponse<BackupConfig>>('/v1/admin/backup-config', data);
    return response.data.data;
  },
};
