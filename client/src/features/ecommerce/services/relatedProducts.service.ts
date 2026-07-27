import axiosInstance from '@/shared/api/axiosInstance';

export interface RelatedProductItem {
  id: number;
  name: string;
  slug: string;
  images: Array<{ url: string; isMain: boolean }>;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  minPrice: number;
  maxPrice: number;
  minDiscount: number;
  maxDiscount: number;
  variantId: number;
  isOutOfStock: boolean;
}

export const relatedProductsService = {
  async getRelated(productId: number, userId?: number): Promise<RelatedProductItem[]> {
    const params: Record<string, string> = {};
    if (userId) params.userId = String(userId);
    const { data } = await axiosInstance.get(`/v1/ecommerce/products/${productId}/related`, { params });
    return data.data ?? [];
  },
};
