import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import type { KardexEntry, KardexFilters } from '../types/kardex.types';

export const useKardex = () => {
  const [entries, setEntries] = useState<KardexEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchKardex = useCallback(async (filters: KardexFilters) => {
    if (!filters.variantId || !filters.branchId) {
      setEntries([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('variantId', String(filters.variantId));
      params.append('branchId', String(filters.branchId));
      
      if (filters.from) {
        params.append('from', new Date(filters.from).toISOString());
      }
      if (filters.to) {
        params.append('to', new Date(filters.to).toISOString());
      }
      if (filters.type) {
        params.append('type', filters.type);
      }

      const { data } = await axiosInstance.get(`/v1/kardex?${params.toString()}`);
      if (data.success) {
        setEntries(data.data || []);
      } else {
        toast.error(data.error || 'Error al cargar los movimientos del Kardex');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Error de conexión al cargar Kardex';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    entries,
    loading,
    fetchKardex,
  };
};
