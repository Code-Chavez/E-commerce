export interface BranchRevenueBreakdown {
  branchId: number | null;
  branchName: string;
  total: number;
}

export interface FinancialPeriod {
  totalRevenue: number;
  posRevenue: number;
  ecommerceRevenue: number;
  revenueByBranch: BranchRevenueBreakdown[];
}

export interface FinancialDashboardSummary {
  currentPeriod: FinancialPeriod;
  previousPeriod: FinancialPeriod;
  comparison: {
    revenueDifference: number;
    revenuePercentageChange: number;
  };
}
