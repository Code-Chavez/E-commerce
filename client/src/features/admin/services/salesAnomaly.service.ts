import axiosInstance from '@/shared/api/axiosInstance';

export interface SalesAnomaly {
  id: number;
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  date: string;
  avgSales: number;
  stdDev: number;
  actualSales: number;
  sigmas: number;
  direction: 'HIGH' | 'LOW';
  isActive: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export const salesAnomalyService = {
  async getActive(): Promise<SalesAnomaly[]> {
    const { data } = await axiosInstance.get('/v1/admin/sales-anomalies', { params: { onlyActive: 'true' } });
    return data.data ?? [];
  },

  async getAll(): Promise<SalesAnomaly[]> {
    const { data } = await axiosInstance.get('/v1/admin/sales-anomalies', { params: { onlyActive: 'false' } });
    return data.data ?? [];
  },

  async resolve(id: number): Promise<void> {
    await axiosInstance.patch(`/v1/admin/sales-anomalies/${id}/resolve`);
  },
};
