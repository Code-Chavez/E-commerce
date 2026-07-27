import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

export interface CashRegister {
  id: number;
  branchId: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: number;
    name: string;
  };
}

export const useCashRegisters = () => {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchRegisters = useCallback(async (branchId?: number) => {
    setLoading(true);
    try {
      const url = branchId ? `/v1/cash-registers?branchId=${branchId}` : `/v1/cash-registers`;
      const { data } = await axiosInstance.get(url);
      if (data.success) {
        setRegisters(data.data);
      } else {
        toast.error('Error al recuperar las cajas registradoras');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al conectar con el servidor';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRegister = useCallback(async (formData: { branchId: number; name: string }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post('/v1/cash-registers', formData);
      if (data.success) {
        toast.success(`Caja "${data.data.name}" creada con éxito`);
        setRegisters((prev) => [...prev, data.data]);
        return data.data;
      }
      return null;
    } catch (error: any) {
      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors)) {
        serverErrors.forEach((err: any) => {
          toast.error(err.message || `Error en el campo: ${err.field}`);
        });
      } else {
        const errorMessage = error.response?.data?.error || 'Error al crear la caja';
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateRegister = useCallback(async (id: number, formData: { name: string }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.patch(`/v1/cash-registers/${id}`, formData);
      if (data.success) {
        toast.success(`Caja "${data.data.name}" actualizada con éxito`);
        setRegisters((prev) =>
          prev.map((reg) => (reg.id === id ? { ...reg, ...data.data } : reg))
        );
        return data.data;
      }
      return null;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar la caja';
      toast.error(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteRegister = useCallback(async (id: number) => {
    try {
      const { data } = await axiosInstance.delete(`/v1/cash-registers/${id}`);
      if (data.success) {
        toast.success('Caja registradora desactivada/eliminada con éxito');
        setRegisters((prev) => prev.filter((reg) => reg.id !== id));
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al eliminar la caja';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  return {
    registers,
    loading,
    submitting,
    fetchRegisters,
    createRegister,
    updateRegister,
    deleteRegister,
  };
};
