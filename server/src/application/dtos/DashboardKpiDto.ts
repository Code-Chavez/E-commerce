export interface DashboardKpiDto {
  todaySales: {
    total: number;
    pos: number;
    ecommerce: number;
  };
  pendingOrdersCount: number;
  criticalStock: {
    count: number;
    products: Array<{
      sku: string;
      productName: string;
      branchName: string;
      currentStock: number;
      minStock: number;
    }>;
  };
  salesByBranch: Array<{
    branchId: number;
    branchName: string;
    totalSales: number;
  }>;
}
