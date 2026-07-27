import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import type { InventorySettings, ValuationMethod } from '../types/kardex.types';

export const useInventorySettings = () => {
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/admin/inventory-settings');
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error: any) {
      console.error(error);
      // Solo mostramos toast si no es un error 403 (permiso denegado), 
      // ya que los usuarios con rol SUPPLY no pueden acceder a esta configuración
      if (error.response?.status !== 403) {
        const errorMsg = error.response?.data?.error || 'Error al obtener configuración de inventario';
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMethod = useCallback(async (valuationMethod: ValuationMethod) => {
    setUpdating(true);
    try {
      const { data } = await axiosInstance.put('/v1/admin/inventory-settings', { valuationMethod });
      if (data.success) {
        setSettings(data.data);
        toast.success('Método de valorización actualizado con éxito');
        return true;
      } else {
        toast.error(data.error || 'Error al actualizar el método de valorización');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Error de conexión al actualizar configuración';
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
    return false;
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updating,
    fetchSettings,
    updateMethod,
  };
};
