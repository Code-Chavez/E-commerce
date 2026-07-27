export interface TodaySales {
  total: number;
  pos: number;
  ecommerce: number;
}

export interface CriticalStockProduct {
  sku: string;
  productName: string;
  branchName: string;
  currentStock: number;
  minStock: number;
}

export interface CriticalStock {
  count: number;
  products: CriticalStockProduct[];
}

export interface BranchSales {
  branchId: number;
  branchName: string;
  totalSales: number;
}

export interface DashboardKpis {
  todaySales: TodaySales;
  pendingOrdersCount: number;
  criticalStock: CriticalStock;
  salesByBranch: BranchSales[];
}
