export interface ProfitabilityReportItem {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercentage: number;
}

export interface ProfitabilityReportTotals {
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercentage: number;
}

export interface ProfitabilityReportResponse {
  success: boolean;
  data: {
    items: ProfitabilityReportItem[];
    totals: ProfitabilityReportTotals;
  };
}

export type GroupByOption = 'brand' | 'category';
