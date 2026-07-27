export * from './search.types';
export * from './order.types';
export * from './return.types';

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number | string;
  discountPercent: number;
  attributesJson: Record<string, string>;
  isActive: boolean;
  minStock?: number;
  createdAt?: string;
  updatedAt?: string;
  stock?: number;
  outOfStock: boolean;
  product: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    images: Array<{
      id: number;
      productId: number;
      url: string;
      isMain: boolean;
    }>;
    category?: {
      id: number;
      name: string;
    };
    brand?: {
      id: number;
      name: string;
    };
  };
  salesInLast30Days?: number;
}

export interface CartItem {
  id: number;
  cartId: number;
  variantId: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  variant: ProductVariant & { finalPrice: number };
}

export interface Cart {
  id: number;
  userId: number | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  subtotal: number;
}
