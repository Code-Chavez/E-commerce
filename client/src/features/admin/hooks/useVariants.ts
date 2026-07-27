import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import type { ProductVariant, GenerateVariantsBody, UpdateVariantBody } from '../types/variant';
import toast from 'react-hot-toast';

export const useVariants = (productId: number) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = useCallback(async () => {
    if (!productId || isNaN(productId)) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/v1/products/${productId}/variants`);
      if (response.data.success) {
        setVariants(response.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al cargar las variantes';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const generateVariants = async (body: GenerateVariantsBody): Promise<ProductVariant[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`/v1/products/${productId}/variants`, body);
      if (response.data.success) {
        toast.success('Variantes generadas exitosamente');
        await fetchVariants();
        // Since backend returns ProductWithVariantsResponseDTO, we can return its variants.
        return response.data.data.variants as ProductVariant[];
      }
      return null;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al generar variantes';
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateVariant = async (variantId: number, body: UpdateVariantBody) => {
    try {
      const response = await axiosInstance.put(`/v1/variants/${variantId}`, body);
      if (response.data.success) {
        toast.success('Variante actualizada');
        setVariants((prev) =>
          prev.map((v) => (v.id === variantId ? response.data.data : v))
        );
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al actualizar variante';
      toast.error(msg);
      return false;
    }
  };

  return {
    variants,
    loading,
    error,
    fetchVariants,
    generateVariants,
    updateVariant,
  };
};
