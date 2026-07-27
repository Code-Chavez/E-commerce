export interface SearchQueryParams {
  q?: string;
  categoryId?: number;
  brandId?: number;
  genderId?: number;
  minPrice?: number;
  maxPrice?: number;
  branchId?: number;
  cursor?: number;
  limit?: number;
  orderBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  [key: string]: any;
}

export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  isMain: boolean;
}

export interface SearchProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  attributesJson: Record<string, string>;
  isActive: boolean;
  minStock: number;
  createdAt: string;
  updatedAt: string;
  stock: number;
  outOfStock: boolean;
}

export interface SearchProductItem {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  brandId: number;
  genderId?: number;
  gender: { id: number; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
  brand: Brand;
  images: ProductImage[];
  variants: SearchProductVariant[];
}

export interface ProductSearchResponse {
  success: boolean;
  data: SearchProductItem[];
  pagination: {
    nextCursor?: string | null;
  };
}
