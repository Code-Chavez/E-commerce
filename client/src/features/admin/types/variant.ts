export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  costPrice: number;
  discountPercent?: number;
  attributesJson: Record<string, string>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVariantDTO {
  attributesJson: Record<string, string>;
  price: number;
}

export interface GenerateVariantsBody {
  attributes: Record<string, string[]>;
  basePrice: number;
  baseCostPrice?: number;
}

export interface UpdateVariantBody {
  sku?: string;
  price?: number;
  costPrice?: number;
  discountPercent?: number;
  isActive?: boolean;
}
