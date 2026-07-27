export interface FinancialSaleInput {
  amount: number;
  channel: 'POS' | 'ECOMMERCE';
  branchId: number | null;
  branchName: string;
}

export interface BranchRevenueBreakdown {
  branchId: number | null;
  branchName: string;
  total: number;
}

export interface FinancialDashboardSummary {
  currentPeriod: {
    totalRevenue: number;
    posRevenue: number;
    ecommerceRevenue: number;
    revenueByBranch: BranchRevenueBreakdown[];
  };
  previousPeriod: {
    totalRevenue: number;
    posRevenue: number;
    ecommerceRevenue: number;
    revenueByBranch: BranchRevenueBreakdown[];
  };
  comparison: {
    revenueDifference: number;
    revenuePercentageChange: number;
  };
}

export class FinancialConsolidationService {
  /**
   * Consolidates current and previous sales inputs to generate the financial dashboard report.
   */
  public consolidate(
    currentSales: FinancialSaleInput[],
    previousSales: FinancialSaleInput[]
  ): FinancialDashboardSummary {
    const currentTotals = this.calculatePeriodTotals(currentSales);
    const previousTotals = this.calculatePeriodTotals(previousSales);

    const revenueDifference = currentTotals.totalRevenue - previousTotals.totalRevenue;
    let revenuePercentageChange = 0;
    if (previousTotals.totalRevenue > 0) {
      revenuePercentageChange = (revenueDifference / previousTotals.totalRevenue) * 100;
    }

    return {
      currentPeriod: currentTotals,
      previousPeriod: previousTotals,
      comparison: {
        revenueDifference: Math.round(revenueDifference * 100) / 100,
        revenuePercentageChange: Math.round(revenuePercentageChange * 100) / 100,
      },
    };
  }

  private calculatePeriodTotals(sales: FinancialSaleInput[]) {
    let totalRevenue = 0;
    let posRevenue = 0;
    let ecommerceRevenue = 0;

    const branchMap = new Map<string, { branchId: number | null; total: number }>();

    for (const sale of sales) {
      totalRevenue += sale.amount;
      if (sale.channel === 'POS') {
        posRevenue += sale.amount;
      } else {
        ecommerceRevenue += sale.amount;
      }

      // Group by branch. If it's E-commerce, we group under "E-Commerce" (with branchId null)
      const key = sale.branchName || 'E-Commerce';
      const existing = branchMap.get(key);
      if (existing) {
        existing.total += sale.amount;
      } else {
        branchMap.set(key, {
          branchId: sale.branchId,
          total: sale.amount,
        });
      }
    }

    const revenueByBranch: BranchRevenueBreakdown[] = Array.from(branchMap.entries()).map(
      ([branchName, data]) => ({
        branchId: data.branchId,
        branchName,
        total: Math.round(data.total * 100) / 100,
      })
    );

    // Sort by revenue descending
    revenueByBranch.sort((a, b) => b.total - a.total);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      posRevenue: Math.round(posRevenue * 100) / 100,
      ecommerceRevenue: Math.round(ecommerceRevenue * 100) / 100,
      revenueByBranch,
    };
  }
}
