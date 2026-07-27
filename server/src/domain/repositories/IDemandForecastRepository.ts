export interface VariantHistoricalData {
  variantId: number;
  categoryName: string;
  size: string;
  totalSalesQty: number;
  currentStock: number;
}

export interface IDemandForecastRepository {
  getVariantSalesAndStock(startDate: Date): Promise<VariantHistoricalData[]>;
}
