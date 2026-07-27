import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

export const useInventoryAudits = () => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const createInventoryAudit = useCallback(async (payload: {
    branchId: number;
    status: 'PENDING' | 'CONFIRMED';
    items: Array<{ variantId: number; physicalQty: number }>;
  }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post('/v1/inventory-audits', payload);
      if (data.success) {
        toast.success(
          payload.status === 'CONFIRMED'
            ? 'Auditoría confirmada. Inventario físico sincronizado y ajustes aplicados en Kardex.'
            : 'Borrador de auditoría preliminar guardado correctamente.'
        );
        return data.data;
      }
      return null;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al registrar la auditoría de inventario';
      toast.error(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitting,
    createInventoryAudit,
  };
};
