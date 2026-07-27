import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';

export interface Coupon {
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string | number;
  minPurchaseAmount?: string | number | null;
  specificProductId?: number | null;
  specificCategoryId?: number | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

interface CreateBatchCouponsData {
  prefix: string;
  quantity: number;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minPurchaseAmount?: number;
  specificProductId?: number;
  specificCategoryId?: number;
  expiresAt?: string;
  maxUses?: number;
}

export function useAdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async (page: number = 1, limit: number = 20, isActive?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (isActive !== undefined) {
        params.append('isActive', isActive.toString());
      }

      const response = await axiosInstance.get(`/v1/admin/coupons?${params.toString()}`);
      if (response.data.success) {
        setCoupons(response.data.coupons);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBatch = async (data: CreateBatchCouponsData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/v1/admin/coupons', data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating coupons');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    coupons,
    total,
    totalPages,
    loading,
    error,
    fetchCoupons,
    createBatch
  };
}
