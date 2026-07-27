// DTOs de la capa de aplicación para ProductVariant
// HU-014 — T-077 / T-078

export interface CreateVariantsRequestDTO {
  // Mapa de atributos con sus valores posibles
  // Ej: { "talla": ["S", "M", "L"], "color": ["NEGRO", "BLANCO"] }
  attributes: Record<string, string[]>;
  // Precio base para todas las variantes generadas (puede sobreescribirse por variante)
  basePrice: number;
  // Precio de costo base para todas las variantes generadas
  baseCostPrice?: number;
}

export interface UpdateVariantRequestDTO {
  sku?: string;
  price?: number;
  costPrice?: number;
  isActive?: boolean;
  minStock?: number;
  discountPercent?: number;
}

export interface UpdateVariantMinStockRequestDTO {
  minStock: number;
}

export interface VariantResponseDTO {
  id: number;
  productId: number;
  sku: string;
  price: number;
  costPrice: number;
  attributesJson: Record<string, string>;
  isActive: boolean;
  minStock: number;
  discountPercent?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithVariantsResponseDTO {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  variants: VariantResponseDTO[];
  createdAt: Date;
  updatedAt: Date;
}
