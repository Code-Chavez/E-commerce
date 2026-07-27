export interface PosProductResult {
  variantId: number;
  productId: number;
  sku: string;
  name: string;
  baseName: string;
  price: number;
  stock: number;
  attributes: any;
}

export interface IPosProductRepository {
  searchProducts(query: string, branchId: number): Promise<PosProductResult[]>;
}
