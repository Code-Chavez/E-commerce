import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

export interface BranchStockBreakdown {
  branchId: number;
  branchName: string;
  quantity: number;
}

export interface StockItem {
  variantId: number;
  sku: string;
  productName: string;
  globalStock: number;
  byBranch: BranchStockBreakdown[];
}

export const useStock = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStock = useCallback(async (filters?: { sku?: string; branchId?: number; variantId?: number }) => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters?.sku) params.sku = filters.sku;
      if (filters?.branchId) params.branchId = filters.branchId;
      if (filters?.variantId) params.variantId = filters.variantId;

      const { data } = await axiosInstance.get('/v1/stock', { params });
      if (data.success) {
        setStock(data.data);
      } else {
        toast.error('Error al recuperar el control de existencias');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al conectar con el servidor';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stock,
    loading,
    fetchStock,
  };
};
