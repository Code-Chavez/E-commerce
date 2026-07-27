// ─── HU-051 T-091: DTOs de Ingreso de Mercadería ─────────────────────────────

export interface StockEntryItemRequestDTO {
  variantId: number;
  quantity: number;
  unitCost: number;
}

export interface StockEntryDistributionItemRequestDTO {
  branchId: number;
  variantId: number;
  quantity: number;
}

export interface CreateStockEntryRequestDTO {
  supplierId: number;
  invoiceNumber: string;
  branchId: number;
  items: StockEntryItemRequestDTO[];
  distributionItems?: StockEntryDistributionItemRequestDTO[];
}

export interface StockEntryItemResponseDTO {
  id: number;
  variantId: number;
  quantity: number;
  unitCost: number;
}

export interface StockEntryResponseDTO {
  id: number;
  supplierId: number;
  supplierRazonSocial: string;
  invoiceNumber: string;
  branchId: number;
  items: StockEntryItemResponseDTO[];
  createdAt: Date;
  updatedAt: Date;
}
