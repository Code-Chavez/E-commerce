export interface ProfitabilityInput {
  name: string;      // Brand or Category name
  qty: number;       // Quantity sold
  salePrice: number; // unitPrice from OrderItem
  costPrice: number; // unitCost from Kardex
}

export interface ProfitabilityGroupResult {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercentage: number;
}

export interface ProfitabilitySummary {
  items: ProfitabilityGroupResult[];
  totals: {
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMarginPercentage: number;
  };
}

export class ProfitabilityCalculatorService {
  /**
   * Calculates gross profit and margins grouped by the provided name (brand/category).
   */
  public calculate(inputs: ProfitabilityInput[]): ProfitabilitySummary {
    const groups: Record<string, { totalQuantity: number; totalRevenue: number; totalCost: number }> = {};

    let totalQuantity = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const input of inputs) {
      const revenue = input.salePrice * input.qty;
      const cost = input.costPrice * input.qty;

      if (!groups[input.name]) {
        groups[input.name] = {
          totalQuantity: 0,
          totalRevenue: 0,
          totalCost: 0,
        };
      }

      groups[input.name].totalQuantity += input.qty;
      groups[input.name].totalRevenue += revenue;
      groups[input.name].totalCost += cost;

      totalQuantity += input.qty;
      totalRevenue += revenue;
      totalCost += cost;
    }

    const items: ProfitabilityGroupResult[] = Object.entries(groups).map(([name, data]) => {
      const grossProfit = data.totalRevenue - data.totalCost;
      const profitMarginPercentage = data.totalRevenue > 0 ? (grossProfit / data.totalRevenue) * 100 : 0;
      return {
        name,
        totalQuantity: data.totalQuantity,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalCost: Math.round(data.totalCost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        profitMarginPercentage: Math.round(profitMarginPercentage * 100) / 100,
      };
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMarginPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      items,
      totals: {
        totalQuantity,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        profitMarginPercentage: Math.round(profitMarginPercentage * 100) / 100,
      },
    };
  }
}
