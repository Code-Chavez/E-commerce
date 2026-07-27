import axiosInstance from '@/shared/api/axiosInstance';
import type { Address, CreateAddressDTO, UpdateAddressDTO } from '../types/address.types';

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    const { data } = await axiosInstance.get<{ success: boolean; data: Address[] }>('/v1/addresses');
    return data.data;
  },

  async createAddress(addressData: CreateAddressDTO): Promise<Address> {
    const { data } = await axiosInstance.post<{ success: boolean; message: string; data: Address }>(
      '/v1/addresses',
      addressData
    );
    return data.data;
  },

  async updateAddress(id: number, addressData: UpdateAddressDTO): Promise<Address> {
    const { data } = await axiosInstance.put<{ success: boolean; message: string; data: Address }>(
      `/v1/addresses/${id}`,
      addressData
    );
    return data.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await axiosInstance.delete<{ success: boolean; message: string }>(`/v1/addresses/${id}`);
  },
};
