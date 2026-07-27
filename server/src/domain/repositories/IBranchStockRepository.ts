export interface StockFilter {
  variantId?: number;
  branchId?: number;
  sku?: string;
}

export interface StockGroupedResult {
  variantId: number;
  sku: string;
  productName: string;
  globalStock: number;
  byBranch: {
    branchId: number;
    branchName: string;
    quantity: number;
  }[];
}

export interface IBranchStockRepository {
  getStockReport(filter: StockFilter): Promise<StockGroupedResult[]>;
}
