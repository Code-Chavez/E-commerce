import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';

// DTO de creación de variantes (entrada del use case)
export interface CreateVariantDTO {
  // Atributos de la variante (ej. { "talla": "M", "color": "NEGRO" })
  attributesJson: Record<string, string>;
  price: number;
  costPrice?: number;
}

export interface UpdateVariantDTO {
  sku?: string;    // Editar SKU manualmente (se valida unicidad)
  price?: number;  // Editar precio de venta
  costPrice?: number; // Editar precio de costo
  isActive?: boolean;
  minStock?: number;
  discountPercent?: number;
}

// Repositorio de productos: solo lo necesario para HU-014 / HU-015
export interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  create(data: { code: string; name: string; description?: string }): Promise<Product>;
  findAllActive(): Promise<Product[]>;
  updateStatus(id: number, isActive: boolean): Promise<Product>;
}

export interface VariantSearchResult {
  id: number;
  sku: string;
  productName: string;
  price: number;
  costPrice: number;
}

// Repositorio de variantes
export interface IProductVariantRepository {
  findById(id: number): Promise<ProductVariant | null>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  findByProductId(productId: number): Promise<ProductVariant[]>;
  createMany(variants: (CreateVariantDTO & { productId: number; sku: string })[]): Promise<ProductVariant[]>;
  update(id: number, data: UpdateVariantDTO): Promise<ProductVariant>;
  search(query: string, limit: number): Promise<VariantSearchResult[]>;
}

