import axiosInstance from '@/shared/api/axiosInstance';
import type { SearchQueryParams, ProductSearchResponse, Category, Brand } from '../types/search.types';

export const searchProducts = async (params: SearchQueryParams): Promise<ProductSearchResponse> => {
  const { data } = await axiosInstance.get<ProductSearchResponse>('/v1/ecommerce/products/search', {
    params,
  });
  return data;
};

export const getCategories = async (): Promise<{ success: boolean; data: Category[] }> => {
  const { data } = await axiosInstance.get<{ success: boolean; data: Category[] }>('/v1/categories');
  return data;
};

export const getBrands = async (): Promise<{ success: boolean; data: Brand[] }> => {
  const { data } = await axiosInstance.get<{ success: boolean; data: Brand[] }>('/v1/brands');
  return data;
};

export const getBranches = async (): Promise<{ success: boolean; data: { id: number; name: string }[] }> => {
  const { data } = await axiosInstance.get<{ success: boolean; data: { id: number; name: string }[] }>('/v1/branches');
  return data;
};

export interface AttributeValue {
  id: number;
  value: string;
  isActive: boolean;
}

export interface Attribute {
  id: number;
  name: string;
  isVisualDriver: boolean;
  isActive: boolean;
  values: AttributeValue[];
}

export const getFilterAttributes = async (): Promise<{ success: boolean; data: Attribute[] }> => {
  const { data } = await axiosInstance.get<{ success: boolean; data: Attribute[] }>('/v1/ecommerce/attributes');
  return data;
};
