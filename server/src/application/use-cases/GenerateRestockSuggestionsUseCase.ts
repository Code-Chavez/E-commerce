import { IDemandForecastRepository, VariantHistoricalData } from "@domain/repositories/IDemandForecastRepository";
import { RestockSuggestion } from "@domain/entities/RestockSuggestion";
import { MovingAverageCalculator } from "@domain/services/MovingAverageCalculator";

export class GenerateRestockSuggestionsUseCase {
  constructor(private readonly repository: IDemandForecastRepository) {}

  async execute(months: number = 1): Promise<RestockSuggestion[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const data = await this.repository.getVariantSalesAndStock(startDate);

    return data.map((item: VariantHistoricalData) => {
      const variantDemand = MovingAverageCalculator.calculate(item.totalSalesQty, months);
      const suggestedQty = Math.max(0, variantDemand - item.currentStock);

      return {
        variantId: item.variantId,
        suggestedQty: Math.round(suggestedQty * 100) / 100,
        currentStock: item.currentStock
      };
    });
  }
}
