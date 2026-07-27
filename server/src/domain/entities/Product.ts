import { ProductVariant } from './ProductVariant';
import { Gender } from './Gender';

export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  isMain: boolean;
  createdAt: Date;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number | null;
  brandId?: number | null;
  genderId?: number | null;
  gender?: Gender | null;
  model?: string | null;
  isActive: boolean;
  variants?: ProductVariant[];
  images?: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDTO {
  code: string;
  name: string;
  slug?: string;
  description?: string | null;
  categoryId: number;
  brandId: number;
  genderId?: number | null;
  model?: string | null;
}
