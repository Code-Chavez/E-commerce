import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

export interface Supplier {
  id: number;
  ruc: string;
  razonSocial: string;
  rubro: string;
  contacto: string;
  direccion: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/suppliers');
      if (data.success) {
        setSuppliers(data.data);
      } else {
        toast.error('Error al recuperar los proveedores');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al conectar con el servidor';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = useCallback(async (formData: { ruc: string; razonSocial: string; rubro: string; contacto: string; direccion?: string | null }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post('/v1/suppliers', formData);
      if (data.success) {
        toast.success(`Proveedor "${data.data.razonSocial}" registrado con éxito`);
        setSuppliers((prev) => [data.data, ...prev]);
        return data.data;
      }
      return null;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al registrar el proveedor';
      toast.error(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateSupplier = useCallback(async (id: number, formData: { ruc?: string; razonSocial?: string; rubro?: string; contacto?: string; direccion?: string | null }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.put(`/v1/suppliers/${id}`, formData);
      if (data.success) {
        toast.success(`Proveedor "${data.data.razonSocial}" actualizado con éxito`);
        setSuppliers((prev) =>
          prev.map((supplier) => (supplier.id === id ? data.data : supplier))
        );
        return data.data;
      }
      return null;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar el proveedor';
      toast.error(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const toggleSupplierStatus = useCallback(async (id: number, isActive: boolean) => {
    try {
      const { data } = await axiosInstance.patch(`/v1/suppliers/${id}/status`, { isActive });
      if (data.success) {
        toast.success(isActive ? 'Proveedor activado' : 'Proveedor inactivado');
        setSuppliers((prev) =>
          prev.map((supplier) =>
            supplier.id === id ? { ...supplier, isActive } : supplier
          )
        );
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al cambiar estado del proveedor';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  return {
    suppliers,
    loading,
    submitting,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    toggleSupplierStatus,
  };
};
