import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

export interface Warehouse {
  id: number;
  createdAt: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  isMain: boolean;
  igvExempt: boolean;
  warehouse?: Warehouse | null;
  createdAt: string;
  updatedAt: string;
}

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/branches');
      if (data.success) {
        setBranches(data.data);
      } else {
        toast.error('Error al recuperar las sucursales');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al conectar con el servidor';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBranch = useCallback(async (formData: { name: string; address?: string | null; phone?: string | null; isMain?: boolean; igvExempt?: boolean }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post('/v1/branches', formData);
      if (data.success) {
        toast.success(`Sucursal "${data.data.name}" creada con éxito`);
        if (data.data.isMain) {
          setBranches((prev) => [...prev.map((b) => ({ ...b, isMain: false })), data.data]);
        } else {
          setBranches((prev) => [...prev, data.data]);
        }
        return data.data;
      }
      return null;
    } catch (error: any) {
      // Check for array of field validation errors from server
      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors)) {
        serverErrors.forEach((err: any) => {
          toast.error(err.message || `Error en el campo: ${err.field}`);
        });
      } else {
        const errorMessage = error.response?.data?.error || 'Error al crear la sucursal';
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateBranch = useCallback(async (id: number, formData: { name?: string; address?: string | null; phone?: string | null; isMain?: boolean; igvExempt?: boolean }) => {
    setSubmitting(true);
    try {
      const { data } = await axiosInstance.put(`/v1/branches/${id}`, formData);
      if (data.success) {
        toast.success(`Sucursal "${data.data.name}" actualizada con éxito`);
        if (data.data.isMain) {
          setBranches((prev) =>
            prev.map((branch) => (branch.id === id ? data.data : { ...branch, isMain: false }))
          );
        } else {
          setBranches((prev) =>
            prev.map((branch) => (branch.id === id ? data.data : branch))
          );
        }
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
        const errorMessage = error.response?.data?.error || 'Error al actualizar la sucursal';
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const toggleBranchStatus = useCallback(async (id: number, isActive: boolean) => {
    try {
      const { data } = await axiosInstance.patch(`/v1/branches/${id}/status`, { isActive });
      if (data.success) {
        toast.success(isActive ? 'Sucursal activada' : 'Sucursal desactivada');
        setBranches((prev) =>
          prev.map((branch) =>
            branch.id === id ? { ...branch, isActive } : branch
          )
        );
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar el estado de la sucursal';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  return {
    branches,
    loading,
    submitting,
    fetchBranches,
    createBranch,
    updateBranch,
    toggleBranchStatus,
  };
};
