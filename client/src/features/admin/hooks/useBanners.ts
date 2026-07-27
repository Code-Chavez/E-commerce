import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import type { Banner, CreateBannerPayload, UpdateBannerPayload } from '../types/banner';
import { toast } from 'react-hot-toast';

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/banners');
      if (data.success) {
        // Ensure they are sorted by order field initially
        const sorted = [...data.data].sort((a, b) => a.order - b.order);
        setBanners(sorted);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al cargar los banners';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBanner = async (payload: CreateBannerPayload) => {
    const formData = new FormData();
    formData.append('image', payload.image);
    if (payload.linkUrl) {
      formData.append('linkUrl', payload.linkUrl);
    }
    if (payload.order !== undefined) {
      formData.append('order', String(payload.order));
    }

    try {
      const { data } = await axiosInstance.post('/v1/banners', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (data.success) {
        toast.success('Banner creado con éxito');
        await fetchBanners();
        return true;
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al crear el banner';
      toast.error(msg);
    }
    return false;
  };

  const updateBanner = async (id: number, payload: UpdateBannerPayload) => {
    const formData = new FormData();
    if (payload.image) {
      formData.append('image', payload.image);
    }
    if (payload.linkUrl !== undefined) {
      formData.append('linkUrl', payload.linkUrl || '');
    }
    if (payload.order !== undefined) {
      formData.append('order', String(payload.order));
    }
    if (payload.isActive !== undefined) {
      formData.append('isActive', String(payload.isActive));
    }

    try {
      const { data } = await axiosInstance.put(`/v1/banners/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (data.success) {
        toast.success('Banner actualizado');
        await fetchBanners();
        return true;
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al actualizar el banner';
      toast.error(msg);
    }
    return false;
  };

  const toggleBannerStatus = async (id: number, currentStatus: boolean) => {
    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !currentStatus } : b))
    );

    try {
      const formData = new FormData();
      formData.append('isActive', String(!currentStatus));

      const { data } = await axiosInstance.put(`/v1/banners/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!data.success) {
        throw new Error();
      }
    } catch (error) {
      toast.error('Error al cambiar el estado del banner');
      // Rollback
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: currentStatus } : b))
      );
    }
  };

  const deleteBanner = async (id: number) => {
    try {
      const { data } = await axiosInstance.delete(`/v1/banners/${id}`);
      if (data.success) {
        toast.success('Banner eliminado');
        setBanners((prev) => prev.filter((b) => b.id !== id));
        return true;
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Error al eliminar el banner';
      toast.error(msg);
    }
    return false;
  };

  const reorderBanners = async (reorderedList: Banner[]) => {
    // Optimistic UI update
    const updatedWithOrders = reorderedList.map((banner, index) => ({
      ...banner,
      order: index,
    }));
    setBanners(updatedWithOrders);

    try {
      const payload = {
        orders: updatedWithOrders.map((b) => ({ id: b.id, order: b.order })),
      };
      const { data } = await axiosInstance.patch('/v1/banners/reorder', payload);
      if (!data.success) {
        throw new Error();
      }
    } catch (error) {
      toast.error('Error al guardar el nuevo orden');
      await fetchBanners(); // Rollback to server state
    }
  };

  return {
    banners,
    loading,
    fetchBanners,
    createBanner,
    updateBanner,
    toggleBannerStatus,
    deleteBanner,
    reorderBanners,
  };
};
