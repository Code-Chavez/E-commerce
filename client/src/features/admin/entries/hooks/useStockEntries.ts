import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

export interface VariantSearchResult {
  id: number;
  sku: string;
  productName: string;
  price: number;
  costPrice: number;
}

export const useStockEntries = () => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchingVariants, setSearchingVariants] = useState<boolean>(false);

  const searchVariants = useCallback(async (query: string): Promise<VariantSearchResult[]> => {
    if (!query || query.trim().length < 2) return [];
    setSearchingVariants(true);
    try {
      const { data } = await axiosInstance.get('/v1/variants/search', {
        params: { q: query, limit: 15 },
      });
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error searching variants:', error);
      return [];
    } finally {
      setSearchingVariants(false);
    }
  }, []);

  const createStockEntry = useCallback(async (payload: {
    supplierId: number;
    invoiceNumber: string;
    branchId: number;
    items: Array<{ variantId: number; quantity: number; unitCost: number }>;
  }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post('/v1/stock/entries', payload);
      if (data.success) {
        toast.success('Ingreso de mercadería registrado con éxito. Stock y Kardex actualizados.');
        return data.data;
      }
      return null;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al registrar el ingreso de mercadería';
      toast.error(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    searchingVariants,
    searchVariants,
    createStockEntry,
  };
};
