import { useState, useCallback } from 'react';
import { addressService } from '../services/address.service';
import type { Address, CreateAddressDTO, UpdateAddressDTO } from '../types/address.types';

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await addressService.getAddresses();
      // The backend returns them sorted with isDefault first, then createdAt asc
      setAddresses(data);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al obtener las direcciones';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAddress = async (data: CreateAddressDTO) => {
    setIsSaving(true);
    setError(null);
    try {
      const newAddress = await addressService.createAddress(data);
      // Refetch to ensure correct sorting from backend
      await fetchAddresses();
      return newAddress;
    } catch (err: any) {
      let msg = 'Error al crear la dirección';
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
      setIsSaving(false);
    }
  };

  const editAddress = async (id: number, data: UpdateAddressDTO) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await addressService.updateAddress(id, data);
      await fetchAddresses();
      return updated;
    } catch (err: any) {
      let msg = 'Error al actualizar la dirección';
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
      setIsSaving(false);
    }
  };

  const removeAddress = async (id: number) => {
    setError(null);
    try {
      await addressService.deleteAddress(id);
      await fetchAddresses();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al eliminar la dirección';
      setError(msg);
      throw new Error(msg);
    }
  };

  const setDefaultAddress = async (id: number) => {
    setError(null);
    try {
      await addressService.updateAddress(id, { isDefault: true });
      await fetchAddresses();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al establecer la dirección como predeterminada';
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    addresses,
    isLoading,
    isSaving,
    error,
    fetchAddresses,
    addAddress,
    editAddress,
    removeAddress,
    setDefaultAddress,
  };
};
