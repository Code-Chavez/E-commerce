import { useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import toast from 'react-hot-toast';

export const useUpdatePreferences = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePreferences = async (preferencesJson: Record<string, any>) => {
    setIsUpdating(true);
    try {
      const response = await axiosInstance.patch('/v1/profile/preferences', {
        preferencesJson,
      });

      if (response.data.success) {
        toast.success('Preferencias actualizadas correctamente');
        return true;
      } else {
        toast.error(response.data.error || 'Error al actualizar preferencias');
        return false;
      }
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error(
        error.response?.data?.error || 'Error al comunicarse con el servidor'
      );
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updatePreferences, isUpdating };
};
