import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import type { ProfileFormData } from '../schemas/profile.schema';

export interface ProfileDetails {
  id: number;
  email: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  authProvider: string;
  preferencesJson?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get<{ success: boolean; data: ProfileDetails }>('/v1/profile');
      if (response.data.success) {
        setProfile(response.data.data);
      } else {
        throw new Error('No se pudo cargar el perfil');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al cargar el perfil';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = async (data: ProfileFormData, avatarFile?: File | null) => {
    setIsUpdating(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('lastName', data.lastName);
      formData.append('phone', data.phone);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await axiosInstance.patch<{ success: boolean; message: string; data: ProfileDetails }>(
        '/v1/profile',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setProfile(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al actualizar el perfil');
      }
    } catch (err: any) {
      // Handle Zod or custom validation errors from backend
      let msg = 'Error al actualizar el perfil';
      if (err.response?.data) {
        const resData = err.response.data;
        if (Array.isArray(resData.errors)) {
          msg = resData.errors[0]?.message || msg;
        } else if (resData.error) {
          msg = resData.error;
        } else if (resData.message) {
          msg = resData.message;
        }
      } else {
        msg = err.message || msg;
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    fetchProfile,
    updateProfile,
  };
};
